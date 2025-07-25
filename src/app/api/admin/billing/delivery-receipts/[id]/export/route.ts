import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exportDeliveryReceiptPDF } from "@/lib/actions/delivery-receipts";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "Receipt ID is required" }, { status: 400 });
    }

    // Use the server action to get the PDF
    const result = await exportDeliveryReceiptPDF(id);

    if (!result.success || !result.pdfBuffer || !result.filename) {
      return NextResponse.json(
        { error: result.error || "Failed to generate PDF" },
        { status: 500 }
      );
    }

    // Return the PDF as a download
    return new NextResponse(result.pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': result.pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error in delivery receipt PDF export API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}