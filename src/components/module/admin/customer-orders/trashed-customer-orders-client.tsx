"use client";

import { useState, useTransition } from "react";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { restoreCustomerOrder, purgeExpiredTrashedCustomerOrders } from "@/lib/actions/customer-order";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface TrashedCustomerOrder {
  id: string;
  orderNumber: string;
  deletedAt: Date | null;
  deletedBy: string | null;
  deletedReason: string | null;
  totalAmount: unknown;
  customer: { name: string } | null;
}

interface TrashedCustomerOrdersClientProps {
  data: TrashedCustomerOrder[];
}

function daysUntilPurge(deletedAt: Date | null): number {
  if (!deletedAt) return 0;
  const expiry = new Date(deletedAt);
  expiry.setDate(expiry.getDate() + 30);
  const diff = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function TrashedCustomerOrdersClient({ data }: TrashedCustomerOrdersClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = (id: string) => {
    setRestoringId(id);
    startTransition(async () => {
      try {
        await restoreCustomerOrder(id);
        toast({ title: "Order restored", description: "The customer order has been moved back to active orders." });
        router.refresh();
      } catch (err) {
        toast({
          title: "Restore failed",
          description: err instanceof Error ? err.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setRestoringId(null);
      }
    });
  };

  const handlePurgeExpired = () => {
    startTransition(async () => {
      try {
        const result = await purgeExpiredTrashedCustomerOrders();
        toast({ title: `Purged ${result.purged} expired order(s)`, description: "Records older than 30 days have been permanently deleted." });
        router.refresh();
      } catch (err) {
        toast({
          title: "Purge failed",
          description: err instanceof Error ? err.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
        <Trash2 className="h-8 w-8 opacity-40" />
        <p className="text-sm">No customer orders in trash.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isPending}>
              <Trash2 className="mr-2 h-4 w-4" />
              Purge Expired
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently delete expired orders?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all customer orders that have been in the trash for more than 30 days. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePurgeExpired}>Yes, purge expired</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Deleted On</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Expires In</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((order) => {
            const days = daysUntilPurge(order.deletedAt);
            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium font-mono text-sm">{order.orderNumber}</TableCell>
                <TableCell>{order.customer?.name ?? "—"}</TableCell>
                <TableCell className="text-sm">
                  {order.deletedAt ? new Date(order.deletedAt).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {order.deletedReason ?? "—"}
                </TableCell>
                <TableCell>
                  {days <= 3 ? (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {days}d left
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">{days}d left</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(order.id)}
                    disabled={isPending && restoringId === order.id}
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Restore
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
