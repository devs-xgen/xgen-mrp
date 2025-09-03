"use client";

import Link from "next/link";
import { ChevronDown, BarChart3, Archive, Factory, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function CustomerOrderV2HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <Button asChild>
        <Link href="/admin/customer-orders-v2/create">
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Link>
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Actions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/admin/customer-orders-v2/analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/customer-orders-v2/archives">
            <Archive className="mr-2 h-4 w-4" />
            Archives
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/customer-orders-v2/production-planning">
            <Factory className="mr-2 h-4 w-4" />
            Production Planning
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}
