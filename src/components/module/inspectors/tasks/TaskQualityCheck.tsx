"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyQualityChecks } from "@/lib/actions/inspector/production-order";
import Link from "next/link"; // Import Link from next/link

// Define the correct type for the quality check data we'll be fetching
interface QualityCheckData {
  id: string;
  checkDate: Date;
  status: "PENDING" | "COMPLETED" | "FAILED" | "ACTIVE";
  defectsFound: string | null;
  notes: string | null;
  productionOrder: {
    startDate: string;
    id: string; // The production order ID
    // orderNumber: string;
    product: {
      name: string;
    };
  };
  inspector: {
    profile: {
      firstName: string | null;
      lastName: string | null;
    };
  };
}

export function QualityChecksTable() {
  const [data, setData] = useState<QualityCheckData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQualityChecks = async () => {
      try {
        setLoading(true);
        const checks = await getMyQualityChecks();
        setData(checks as QualityCheckData[]);
      } catch (err) {
        console.error("Failed to fetch quality checks:", err);
        setError("Failed to load quality checks. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchQualityChecks();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "COMPLETED":
        return "default";
      case "FAILED":
        return "destructive";
      case "ACTIVE":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 text-gray-500 font-medium">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-red-500">
        <AlertCircle className="h-10 w-10 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="dark:bg-gray-800">
        <TableHeader>
          <TableRow className="dark:bg-gray-900">
            {/* <TableHead className="w-[100px] text-gray-900 dark:text-gray-900">Check ID</TableHead> */}
            <TableHead className="text-gray-900 dark:text-gray-50">Production Order</TableHead>
            <TableHead className="text-gray-900 dark:text-gray-50">Product</TableHead>
            <TableHead className="text-gray-900 dark:text-gray-50">Status</TableHead>
            <TableHead className="text-gray-900 dark:text-gray-50">Defects Found</TableHead>
            <TableHead className="text-gray-900 dark:text-gray-50">Notes</TableHead>
            <TableHead className=" text-gray-900 dark:text-gray-50">Check Date</TableHead>
            <TableHead className=" text-gray-900 dark:text-gray-50">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((check) => (
              <TableRow key={check.id} className="dark:bg-gray-800 hover:dark:bg-gray-700">
                <TableCell className="font-medium text-gray-900 dark:text-gray-50">
                  {check.id.substring(0, 8)}...
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-50">
                  {check.productionOrder.product.name}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-50">
                  <Badge variant={getStatusBadgeVariant(check.status)}>{check.status}</Badge>
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-50">
                  {check.defectsFound ? (
                    <ul className="list-disc pl-5">
                      {check.defectsFound.split(',').map((defect, index) => (
                        <li key={index}>
                          <div dangerouslySetInnerHTML={{ __html: defect.trim() }} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "None"
                  )}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-50">
                  {check.notes || "N/A"}
                </TableCell>
                <TableCell>
                  {check.productionOrder?.startDate && format(new Date(check.productionOrder.startDate), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="">
                  <Button variant="outline" size="sm" asChild>
                    {/* Corrected Link here */}
                    <Link href={`/inspector/production/${check.productionOrder.id}`}>View</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/inspector/production/quality-history/${check.productionOrder.id}`}>View Inspection History</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="dark:bg-gray-800">
              <TableCell colSpan={7} className="text-center py-8 text-gray-900 dark:text-gray-50">
                No quality checks found for your account.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}