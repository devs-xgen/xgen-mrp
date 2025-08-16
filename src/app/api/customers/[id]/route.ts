import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    // Process the data to handle empty strings for optional decimal fields
    const processedData = {
      ...body,
      // Convert empty string to null for creditLimit (Decimal field)
      creditLimit:
        body.creditLimit === "" || body.creditLimit === undefined
          ? null
          : parseFloat(body.creditLimit),
      modifiedBy: session.user.id,
    };

    const customer = await prisma.customer.update({
      where: {
        id: id,
      },
      data: processedData,
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("[CUSTOMER_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const customer = await prisma.customer.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("[CUSTOMER_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
