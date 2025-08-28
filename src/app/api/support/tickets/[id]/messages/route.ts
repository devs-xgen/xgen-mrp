import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Await params for Next.js 15 compatibility
    const { id } = await params;

    // Check if ticket exists and user has access
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Check permissions - users can only add messages to their own tickets, admins/developers can add to any
    if (
      ticket.userId !== session.user.id &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "DEVELOPER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supportMessage = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        message,
        isAdmin: session.user.role === "ADMIN" || session.user.role === "DEVELOPER",
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Update ticket status if it was resolved and a new message is added
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json(supportMessage, { status: 201 });
  } catch (error) {
    console.error("Error creating support message:", error);
    return NextResponse.json(
      { error: "Failed to create support message" },
      { status: 500 }
    );
  }
}
