"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { SystemErrorData } from "@/lib/actions/superadmin/system-health";
import { formatDistanceToNow } from "date-fns";

interface ErrorLogProps {
  errors: SystemErrorData[];
  onResolveError: (errorId: string, notes: string) => Promise<void>;
}

export function ErrorLog({ errors, onResolveError }: ErrorLogProps) {
  const [selectedError, setSelectedError] = useState<SystemErrorData | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    if (!selectedError || !resolutionNotes.trim()) {
      alert("Please enter resolution notes");
      return;
    }

    setIsResolving(true);
    try {
      await onResolveError(selectedError.id, resolutionNotes);
      setSelectedError(null);
      setResolutionNotes("");
    } catch (error) {
      console.error("Error resolving error:", error);
      alert("Failed to resolve error");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Recent Errors</h3>
          </div>
          <Badge variant="outline">
            {errors.filter(e => !e.resolved).length} Unresolved
          </Badge>
        </div>

        {errors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No Errors Logged</p>
            <p className="text-sm mt-1">System is running smoothly!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.map(error => (
                  <TableRow key={error.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(error.timestamp), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {error.errorType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm truncate">{error.message}</p>
                    </TableCell>
                    <TableCell>
                      {error.resolved ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => setSelectedError(error)}
                        size="sm"
                        variant="outline"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Error Details Dialog */}
      {selectedError && (
        <Dialog open onOpenChange={() => setSelectedError(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Error Details</DialogTitle>
              <DialogDescription>
                {new Date(selectedError.timestamp).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Error Type</Label>
                <p className="mt-1 font-mono text-sm">{selectedError.errorType}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Message</Label>
                <p className="mt-1 text-sm">{selectedError.message}</p>
              </div>

              {selectedError.stackTrace && (
                <div>
                  <Label className="text-sm font-medium">Stack Trace</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {selectedError.stackTrace}
                  </pre>
                </div>
              )}

              {selectedError.context && Object.keys(selectedError.context).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Context</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedError.context, null, 2)}
                  </pre>
                </div>
              )}

              {selectedError.resolved ? (
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="font-medium text-sm text-green-900 dark:text-green-100">
                      Resolved
                    </p>
                  </div>
                  {selectedError.resolvedAt && (
                    <p className="text-xs text-green-800 dark:text-green-200">
                      {new Date(selectedError.resolvedAt).toLocaleString()}
                    </p>
                  )}
                  {selectedError.resolutionNotes && (
                    <p className="text-sm mt-2 text-green-900 dark:text-green-100">
                      {selectedError.resolutionNotes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Label htmlFor="resolutionNotes">Mark as Resolved</Label>
                  <Textarea
                    id="resolutionNotes"
                    value={resolutionNotes}
                    onChange={e => setResolutionNotes(e.target.value)}
                    placeholder="Describe how this error was resolved..."
                    rows={3}
                  />
                  <Button
                    onClick={handleResolve}
                    disabled={isResolving || !resolutionNotes.trim()}
                  >
                    {isResolving ? "Resolving..." : "Mark as Resolved"}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
