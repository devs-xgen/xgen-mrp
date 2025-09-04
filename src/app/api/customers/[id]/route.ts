import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

    // Revalidate the customers page to show fresh data
    revalidatePath("/admin/customers");

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("[CUSTOMER_PATCH]", error);

    // Handle Prisma unique constraint violations
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      if (field === "code") {
        return new NextResponse(
          "Customer code already exists. Please use a different code.",
          { status: 400 }
        );
      }
      return new NextResponse("A customer with these details already exists.", {
        status: 400,
      });
    }

    // Handle validation errors
    if (error.code === "P2000") {
      return new NextResponse(
        "Invalid data provided. Please check your input.",
        { status: 400 }
      );
    }

    return new NextResponse("Failed to update customer. Please try again.", {
      status: 500,
    });
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

    // Revalidate the customers page to show fresh data
    revalidatePath("/admin/customers");

    return NextResponse.json(customer);
  } catch (error) {
    console.error("[CUSTOMER_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
