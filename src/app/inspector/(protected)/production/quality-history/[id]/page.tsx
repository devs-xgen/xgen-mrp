import QualityHistoryClient from "@/components/module/inspectors/tasks/qualityhistoryclient";
import { getMyQualityCheckNotes } from "@/lib/actions/inspector/production-order";

export default async function Page({ params }) {
  const productionOrderId = params.id;

  // Fetch ALL quality checks made by this inspector
  const allChecks = await getMyQualityCheckNotes();

  // Filter only checks related to THIS production order
  const checks = allChecks
    .filter((c) => c.productionOrder.id === productionOrderId)
    .map((c) => ({
      id: c.id, // <-- THIS IS THE *REAL* qualityCheck.id
      checkDate: c.checkDate,
      status: c.status,
      defectsFound: c.defectsFound,
      notes: c.notes,
      actionTaken: c.actionTaken,
      inspectorName:
        (c.inspector?.profile?.firstName || "") +
        " " +
        (c.inspector?.profile?.lastName || ""),
    }));

  // ✔ Pick the single quality check ID to update
  // If there are multiple, we take the latest one
  const qualityCheckId = checks.length > 0 ? checks[0].id : null;

  return (
    <div className="p-6">
      <QualityHistoryClient
        checks={checks}
        qualityCheckId={qualityCheckId} // <-- FIXED!
      />
    </div>
  );
}



// // "use client";

// // import { useEffect, useState } from "react";
// // import { Eye } from "lucide-react";
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// // import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// // import { formatDate } from "@/lib/utils";

// // // Props: pass quality checks from parent page
// // // Enhanced history page with search, filters, grouping, and inspector/PO quick-access view
// // // History page with linking, timeline mode, and defect highlighting

// // type ViewRichTextDialogProps = {
// //   title: string;
// //   content?: string | null;
// //   children?: React.ReactNode;
// // };

// // function ViewRichTextDialog({ title, content, children }: ViewRichTextDialogProps) {
// //   const [open, setOpen] = useState(false);

// //   return (
// //     <>
// //       <span onClick={() => setOpen(true)} className="inline-flex">
// //         {children}
// //       </span>

// //       {open && (
// //         <div className="fixed inset-0 z-50 flex items-center justify-center">
// //           <div className="bg-white rounded shadow-lg max-w-xl w-full p-4 z-50">
// //             <div className="flex justify-between items-center mb-2">
// //               <h3 className="text-lg font-semibold">{title}</h3>
// //               <button
// //                 className="text-sm text-muted-foreground"
// //                 onClick={() => setOpen(false)}
// //                 aria-label="Close"
// //               >
// //                 Close
// //               </button>
// //             </div>

// //             <div className="prose max-h-64 overflow-auto">
// //               {content ? content : <span className="text-muted-foreground">No content</span>}
// //             </div>
// //           </div>

// //           <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
// //         </div>
// //       )}
// //     </>
// //   );
// // }
// // export default function QualityHistoryPage({ checks = [] }) {
// //   const [history, setHistory] = useState([]);

// //   useEffect(() => {
// //     // Build record list containing defects + notes + actionTaken as history entries
// //     const records = checks.map((c) => ({
// //       id: c.id,
// //       date: c.checkDate,
// //       inspector: c.inspectorName,
// //       defects: c.defectsFound,
// //       notes: c.notes,
// //       actionTaken: c.actionTaken,
// //       status: c.status,
// //     }));

// //     setHistory(records);
// //   }, [checks]);

// //   // --- UI STATE ---
// //   const [timelineMode, setTimelineMode] = useState(false); // toggle between table and timeline
// //   const [search, setSearch] = useState("");
// //   const [statusFilter, setStatusFilter] = useState("ALL");
// //   const [groupBy, setGroupBy] = useState("NONE");

// //   // --- FILTERED & GROUPED DATA ---
// //   const filtered = history.filter((h) => {
// //     const matchesSearch =
// //       search.trim() === "" ||
// //       (h.defects || "").toLowerCase().includes(search.toLowerCase()) ||
// //       (h.notes || "").toLowerCase().includes(search.toLowerCase()) ||
// //       (h.actionTaken || "").toLowerCase().includes(search.toLowerCase());

// //     const matchesStatus =
// //       statusFilter === "ALL" || h.status === statusFilter;

// //     return matchesSearch && matchesStatus;
// //   });

// //   // Grouping logic
// //   const grouped = groupBy === "NONE"
// //     ? { All: filtered }
// //     : filtered.reduce((acc, item) => {
// //         const key = groupBy === "INSPECTOR" ? item.inspector || "Unknown" : item.status;
// //         if (!acc[key]) acc[key] = [];
// //         acc[key].push(item);
// //         return acc;
// //       }, {});

// //   // Highlight: defects exist but no actionTaken
// //   const isPendingFix = (item) => item.defects && !item.actionTaken;

// //   return (
// //     <Card className="border-2 border-muted">
// //       <div className="flex justify-between items-center px-6 pt-4">
// //         <div className="flex items-center gap-2">
// //           <Button variant="outline" onClick={() => setTimelineMode(!timelineMode)}>
// //             {timelineMode ? "Show Table" : "Show Timeline"}
// //           </Button>
// //         </div>
// //       </div>
// //       <CardHeader className="pb-3">
// //         <CardTitle className="text-xl font-bold">Quality Notes & Defect History</CardTitle>
// //         <CardDescription>Review all defect logs, inspector notes, and corrective actions.</CardDescription>
// //       </CardHeader>

// //       <CardContent>
// //         {history.length === 0 ? (
// //           <div className="text-center text-muted-foreground py-8">No history records found.</div>
// //         ) : (
// //           <Table>
// //             <TableHeader>
// //               <TableRow>
// //                 <TableHead>Date</TableHead>
// //                 <TableHead>Inspector</TableHead>
// //                 <TableHead>Defects</TableHead>
// //                 <TableHead>Action Taken</TableHead>
// //                 <TableHead>Notes</TableHead>
// //                 <TableHead>Status</TableHead>
// //               </TableRow>
// //             </TableHeader>

// //             <TableBody>
// //               {history.map((row) => (
// //                 <TableRow key={row.id}>
// //                   <TableCell>{formatDate(row.date)}</TableCell>
// //                   <TableCell>{row.inspector || "Unknown"}</TableCell>

// //                   <TableCell className="text-center">
// //                     {row.defects ? (
// //                       <ViewRichTextDialog title="Defects Found" content={row.defects}>
// //                         <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
// //                       </ViewRichTextDialog>
// //                     ) : (
// //                       <span className="text-muted-foreground">None</span>
// //                     )}
// //                   </TableCell>

// //                   <TableCell className="text-center">
// //                     {row.actionTaken ? (
// //                       <ViewRichTextDialog title="Corrective Action" content={row.actionTaken}>
// //                         <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
// //                       </ViewRichTextDialog>
// //                     ) : (
// //                       <span className="text-muted-foreground">None</span>
// //                     )}
// //                   </TableCell>

// //                   <TableCell className="text-center">
// //                     {row.notes ? (
// //                       <ViewRichTextDialog title="Inspection Notes" content={row.notes}>
// //                         <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
// //                       </ViewRichTextDialog>
// //                     ) : (
// //                       <span className="text-muted-foreground">None</span>
// //                     )}
// //                   </TableCell>

// //                   <TableCell className="font-medium capitalize">{row.status.toLowerCase()}</TableCell>
// //                 </TableRow>
// //               ))}
// //             </TableBody>
// //           </Table>
// //         )}
// //       </CardContent>
// //     </Card>
// //   );
// // }





// "use client";

// import { useState, useMemo } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Eye } from "lucide-react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { formatDate } from "@/lib/utils";

// // ---------------- Dialog for Viewing Rich Text ----------------

// function ViewRichTextDialog({ title, content, children }) {
//   const [open, setOpen] = useState(false);

//   return (
//     <>
//       <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
//         {children}
//       </span>

//       {open && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div className="bg-white rounded shadow-lg max-w-xl w-full p-4 z-50">
//             <div className="flex justify-between items-center mb-2">
//               <h3 className="text-lg font-semibold">{title}</h3>
//               <button
//                 className="text-sm text-muted-foreground"
//                 onClick={() => setOpen(false)}
//               >
//                 Close
//               </button>
//             </div>

//             <div
//               className="prose max-h-64 overflow-auto"
//               dangerouslySetInnerHTML={{
//                 __html: content || "<span>No content</span>",
//               }}
//             />
//           </div>

//           <div
//             className="fixed inset-0 bg-black/50"
//             onClick={() => setOpen(false)}
//           />
//         </div>
//       )}
//     </>
//   );
// }

// // ---------------- Main Client Component ----------------------

// export default function QualityHistoryClient({ productionOrder, checks }) {
//   const [timelineMode, setTimelineMode] = useState(false);
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("ALL");
//   const [groupBy, setGroupBy] = useState("NONE");

//   // SAFETY: prevent crashes if checks is undefined/null
//   const safeChecks = Array.isArray(checks) ? checks : [];

//   // ---------------- Filtering -----------------------------

//   const filtered = useMemo(() => {
//     const s = search.toLowerCase();

//     return safeChecks.filter((h) => {
//       const matchesSearch =
//         s === "" ||
//         (h.defectsFound || "").toLowerCase().includes(s) ||
//         (h.notes || "").toLowerCase().includes(s) ||
//         (h.actionTaken || "").toLowerCase().includes(s);

//       const matchesStatus =
//         statusFilter === "ALL" || h.status === statusFilter;

//       return matchesSearch && matchesStatus;
//     });
//   }, [safeChecks, search, statusFilter]);

//   // ---------------- Grouping ------------------------------

//   const grouped = useMemo(() => {
//     if (groupBy === "NONE") return { All: filtered };

//     return filtered.reduce((acc, item) => {
//       const key =
//         groupBy === "INSPECTOR"
//           ? item.inspectorName || "Unknown"
//           : item.status;

//       if (!acc[key]) acc[key] = [];
//       acc[key].push(item);

//       return acc;
//     }, {});
//   }, [filtered, groupBy]);

//   // Highlight missing corrective action
//   const pendingFix = (item) => item.defectsFound && !item.actionTaken;

//   // -----------------------------------------------------------

//   return (
//     <Card className="border-2 border-muted mt-6">
//       <div className="flex justify-between items-center px-6 pt-4">
//         <Button variant="outline" onClick={() => setTimelineMode(!timelineMode)}>
//           {timelineMode ? "Show Table" : "Show Timeline"}
//         </Button>

//         <input
//           type="text"
//           placeholder="Search defects, notes, actions..."
//           className="border px-3 py-1 rounded ml-4"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//       </div>

//       <CardHeader>
//         <CardTitle className="text-xl font-bold">
//           Quality Notes & Defect History
//         </CardTitle>
//         <CardDescription>
//           Review all defect logs, inspector notes, and corrective actions.
//         </CardDescription>
//       </CardHeader>

//       <CardContent>
//         {safeChecks.length === 0 && (
//           <div className="text-center text-muted-foreground py-8">
//             No history records found.
//           </div>
//         )}

//         {!timelineMode && safeChecks.length > 0 && (
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Date</TableHead>
//                 <TableHead>Inspector</TableHead>
//                 <TableHead>Defects</TableHead>
//                 <TableHead>Action Taken</TableHead>
//                 <TableHead>Notes</TableHead>
//                 <TableHead>Status</TableHead>
//               </TableRow>
//             </TableHeader>

//             <TableBody>
//               {filtered.map((row) => (
//                 <TableRow
//                   key={row.id}
//                   className={pendingFix(row) ? "bg-red-50" : ""}
//                 >
//                   <TableCell>{formatDate(row.checkDate)}</TableCell>
//                   <TableCell>{row.inspectorName || "Unknown"}</TableCell>

//                   <TableCell className="text-center">
//                     {row.defectsFound ? (
//                       <ViewRichTextDialog title="Defects" content={row.defectsFound}>
//                         <Button variant="ghost" size="sm">
//                           <Eye className="h-4 w-4" />
//                         </Button>
//                       </ViewRichTextDialog>
//                     ) : (
//                       "None"
//                     )}
//                   </TableCell>

//                   <TableCell className="text-center">
//                     {row.actionTaken ? (
//                       <ViewRichTextDialog
//                         title="Corrective Action"
//                         content={row.actionTaken}
//                       >
//                         <Button variant="ghost" size="sm">
//                           <Eye className="h-4 w-4" />
//                         </Button>
//                       </ViewRichTextDialog>
//                     ) : (
//                       "None"
//                     )}
//                   </TableCell>

//                   <TableCell className="text-center">
//                     {row.notes ? (
//                       <ViewRichTextDialog title="Notes" content={row.notes}>
//                         <Button variant="ghost" size="sm">
//                           <Eye className="h-4 w-4" />
//                         </Button>
//                       </ViewRichTextDialog>
//                     ) : (
//                       "None"
//                     )}
//                   </TableCell>

//                   <TableCell>{row.status}</TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
