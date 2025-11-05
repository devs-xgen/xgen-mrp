"use client";

import { useEffect, useState } from "react";
import { getLoginHistory, LoginHistoryRecord } from "@/lib/actions/login-history";
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
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export function LoginHistoryTable() {
  const [records, setRecords] = useState<LoginHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 50;

  useEffect(() => {
    loadData();
  }, [page]);

  async function loadData() {
    setLoading(true);
    setError(null);

    const result = await getLoginHistory({
      limit,
      offset: page * limit,
    });

    if (result.success && result.data) {
      setRecords(result.data as LoginHistoryRecord[]);
      setHasMore(result.pagination?.hasMore || false);
    } else {
      setError(result.error || "Failed to load login history");
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-8">Loading login history...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No login history found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Portal</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Browser</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Login Time</TableHead>
              <TableHead>Failure Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {record.successful ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {record.user.profile
                        ? `${record.user.profile.firstName} ${record.user.profile.lastName}`
                        : record.user.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {record.portal.replace("_PORTAL", "")}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {record.ipAddress || "N/A"}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {record.browser || "Unknown"}
                    {record.browserVersion && (
                      <span className="text-muted-foreground">
                        {" "}
                        {record.browserVersion}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {record.device || "Unknown"}
                    {record.deviceType && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {record.deviceType}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {record.os || "Unknown"}
                    {record.osVersion && (
                      <span className="text-muted-foreground">
                        {" "}
                        {record.osVersion}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(record.loginAt), "PPp")}
                  </div>
                </TableCell>
                <TableCell>
                  {record.failureReason && (
                    <Badge variant="destructive" className="text-xs">
                      {record.failureReason}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {page * limit + 1} - {page * limit + records.length}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
