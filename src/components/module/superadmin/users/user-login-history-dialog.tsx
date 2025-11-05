"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Activity,
  Globe,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";
import { format } from "date-fns";
import { getLoginHistory, LoginHistoryRecord } from "@/lib/actions/login-history";
import type { UserData } from "@/types/admin/user";

interface UserLoginHistoryDialogProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserLoginHistoryDialog({
  user,
  open,
  onOpenChange,
}: UserLoginHistoryDialogProps) {
  const [records, setRecords] = useState<LoginHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (open && user) {
      loadData();
    } else {
      // Reset state when dialog closes
      setPage(0);
      setRecords([]);
      setError(null);
    }
  }, [open, user, page]);

  async function loadData() {
    if (!user) return;

    setLoading(true);
    setError(null);

    const result = await getLoginHistory({
      userId: user.id,
      limit,
      offset: page * limit,
    });

    if (result.success && result.data) {
      setRecords(result.data as LoginHistoryRecord[]);
      setHasMore(result.pagination?.hasMore || false);
      setTotalCount(result.pagination?.total || 0);
    } else {
      setError(result.error || "Failed to load login history");
    }

    setLoading(false);
  }

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      case "desktop":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  if (!user) return null;

  const userName = user.profile?.firstName
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Login History - {userName}
          </DialogTitle>
          <DialogDescription>
            Complete login activity for {user.email}
            {totalCount > 0 && ` (${totalCount} total records)`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading login history...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">
              Error: {error}
            </div>
          )}

          {!loading && !error && records.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No login history found for this user
            </div>
          )}

          {!loading && !error && records.length > 0 && (
            <>
              <ScrollArea className="h-[500px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Status</TableHead>
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
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">Success</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs">Failed</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {record.portal.replace("_PORTAL", "")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-xs">
                              {record.ipAddress || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {record.browser || "Unknown"}
                            {record.browserVersion && (
                              <span className="text-muted-foreground ml-1">
                                v{record.browserVersion}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(record.deviceType)}
                            <div className="text-xs">
                              <div>{record.device || "Unknown"}</div>
                              {record.deviceType && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {record.deviceType}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {record.os || "Unknown"}
                            {record.osVersion && (
                              <span className="text-muted-foreground ml-1">
                                {record.osVersion}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs whitespace-nowrap">
                            {format(new Date(record.loginAt), "MMM d, yyyy")}
                            <div className="text-muted-foreground">
                              {format(new Date(record.loginAt), "h:mm:ss a")}
                            </div>
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
              </ScrollArea>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  Showing {page * limit + 1} - {Math.min(page * limit + records.length, totalCount)} of {totalCount}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
