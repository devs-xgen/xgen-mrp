import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, QrCode, Wrench, Boxes } from "lucide-react";

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline" className="justify-start gap-2">
            <Link href="/worker/tasks">
              <ClipboardList className="h-4 w-4" />
              My Tasks
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start gap-2">
            <Link href="/worker/tasks/operations">
              <Wrench className="h-4 w-4" />
              Operations
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start gap-2">
            <Link href="/worker/qr-scanner">
              <QrCode className="h-4 w-4" />
              QR Scanner
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start gap-2">
            <Link href="/worker/inventory">
              <Boxes className="h-4 w-4" />
              Inventory
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
