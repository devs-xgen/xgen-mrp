import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
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
      createdBy: session.user.id,
    };

    const customer = await prisma.customer.create({
      data: processedData,
    });

    // Revalidate the customers page to show fresh data
    revalidatePath("/admin/customers");

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("[CUSTOMERS_POST]", error);

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

    return new NextResponse("Failed to create customer. Please try again.", {
      status: 500,
    });
  }
}

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("[CUSTOMERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
