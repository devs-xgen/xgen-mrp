// src/components/module/admin/purchase-orders/purchase-order-print.tsx
"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { PurchaseOrder } from "@/types/admin/purchase-order";
import { Status } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Printer, Download, Share2 } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import Image from "next/image";

interface PurchaseOrderPrintProps {
  purchaseOrder: PurchaseOrder;
}

export function PurchaseOrderPrint({ purchaseOrder }: PurchaseOrderPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Fixed usage of useReactToPrint
  const handlePrint = useReactToPrint({
    documentTitle: `PurchaseOrder_${purchaseOrder.poNumber}`,
    // Use contentRef to correctly reference the print content
    contentRef: printRef,
  });

  // Function to get status badge color
  const getStatusColor = (status: Status): string => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format dates
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Print Purchase Order</DialogTitle>
          <DialogDescription>
            Preview and print your purchase order
          </DialogDescription>
        </DialogHeader>

        {/* Print Actions */}
        <div className="flex justify-end space-x-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => handlePrint()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePrint()}>
            <Download className="mr-2 h-4 w-4" />
            Save as PDF
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Printable Content */}
        <div
          className="border rounded-md p-8 max-h-[70vh] overflow-y-auto bg-white"
          ref={printRef}
        >
          {/* Company Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="h-16 w-48 relative bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">Company Logo</span>
              </div>
              <h2 className="text-lg font-bold mt-2">Your Company Name</h2>
              <p className="text-sm text-gray-500">123 Business Street</p>
              <p className="text-sm text-gray-500">City, State 12345</p>
              <p className="text-sm text-gray-500">Phone: (123) 456-7890</p>
              <p className="text-sm text-gray-500">Email: info@company.com</p>
            </div>

            <div className="text-right">
              <h1 className="text-2xl font-bold">PURCHASE ORDER</h1>
              <p className="text-lg font-semibold">{purchaseOrder.poNumber}</p>
              <div
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(
                  purchaseOrder.status
                )}`}
              >
                {purchaseOrder.status}
              </div>
            </div>
          </div>

          {/* Order Info & Supplier Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-2">Order Information</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-y-2">
                  <p className="text-sm font-medium">Order Date:</p>
                  <p className="text-sm">
                    {formatDate(purchaseOrder.orderDate)}
                  </p>

                  <p className="text-sm font-medium">Expected Delivery:</p>
                  <p className="text-sm">
                    {formatDate(purchaseOrder.expectedDelivery)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">Supplier</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-semibold">{purchaseOrder.supplier.name}</p>
                <p className="text-sm text-gray-500">
                  Code: {purchaseOrder.supplier.code}
                </p>
                {/* Add more supplier details if available */}
              </div>
            </div>
          </div>

          {/* Order Lines */}
          <h3 className="text-lg font-bold mb-2">Order Lines</h3>
          <table className="min-w-full bg-white border border-gray-200 mb-8">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 border-b text-left">No.</th>
                <th className="py-2 px-4 border-b text-left">Material</th>
                <th className="py-2 px-4 border-b text-left">SKU</th>
                <th className="py-2 px-4 border-b text-right">Quantity</th>
                <th className="py-2 px-4 border-b text-right">Unit Price</th>
                <th className="py-2 px-4 border-b text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrder.orderLines.map((line, index) => {
                const lineTotal = line.quantity * Number(line.unitPrice);

                return (
                  <tr
                    key={line.id}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="py-2 px-4 border-b">{index + 1}</td>
                    <td className="py-2 px-4 border-b">{line.material.name}</td>
                    <td className="py-2 px-4 border-b">{line.material.sku}</td>
                    <td className="py-2 px-4 border-b text-right">
                      {line.quantity} {line.material.unitOfMeasure.symbol}
                    </td>
                    <td className="py-2 px-4 border-b text-right">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PHP",
                      }).format(Number(line.unitPrice))}
                    </td>
                    <td className="py-2 px-4 border-b text-right">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PHP",
                      }).format(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-50">
                <td colSpan={5} className="py-2 px-4 border-b text-right">
                  Total:
                </td>
                <td className="py-2 px-4 border-b text-right">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PHP",
                  }).format(Number(purchaseOrder.totalAmount))}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Notes & Terms */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-2">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-md min-h-[100px]">
                <p className="text-sm">
                  {purchaseOrder.notes || "No notes provided."}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">Terms & Conditions</h3>
              <div className="bg-gray-50 p-4 rounded-md min-h-[100px]">
                <p className="text-sm">
                  1. All items must meet quality specifications.
                  <br />
                  2. Prices include all applicable taxes.
                  <br />
                  3. Items must be delivered by the expected delivery date.
                  <br />
                  4. Payment terms: Net 30 days.
                </p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-12">
            <div>
              <div className="border-t border-gray-300 pt-4 mt-12 w-64">
                <p className="text-sm font-medium">Authorized by</p>
              </div>
            </div>

            <div>
              <div className="border-t border-gray-300 pt-4 mt-12 w-64">
                <p className="text-sm font-medium">Received by</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t text-center text-sm text-gray-500">
            <p>This is an official document of Your Company Name.</p>
            <p>
              Purchase Order: {purchaseOrder.poNumber} • Generated on{" "}
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handlePrint()}>
            Print Purchase Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
