// src/components/module/admin/production/quality-checks.tsx
"use client"

import { Status } from "@prisma/client"
import { formatDate } from "@/lib/utils"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface QualityCheck {
  id: string
  checkDate: Date
  status: Status
  defectsFound?: string | null
  actionTaken?: string | null
}

interface QualityChecksProps {
  checks: QualityCheck[]
  onAddCheck?: () => void
  isLoading?: boolean
}

export function QualityChecks({
  checks,
  onAddCheck,
  isLoading = false
}: QualityChecksProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Quality Checks</CardTitle>
            <CardDescription>Quality inspection reports and actions</CardDescription>
          </div>
          {onAddCheck && (
            <Button onClick={onAddCheck} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Quality Check
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Defects Found</TableHead>
              <TableHead>Action Taken</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No quality checks recorded
                </TableCell>
              </TableRow>
            ) : (
              checks.map((check) => (
                <TableRow key={check.id}>
                  <TableCell>
                    {formatDate(check.checkDate)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        check.status === "COMPLETED"
                          ? "default"
                          : check.status === "PENDING"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {check.status.toLowerCase().replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {check.defectsFound || "None"}
                  </TableCell>
                  <TableCell>
                    {check.actionTaken || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}