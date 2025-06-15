// src/app/api/inspectors/profile/route.ts
import { NextResponse } from "next/server";
import { getLoggedInInspectorData } from "@/lib/actions/inspectors";

export async function GET() {
  try {
    const inspector = await getLoggedInInspectorData();
    if (!inspector) {
      return NextResponse.json({ error: "No inspector found" }, { status: 404 });
    }

    return NextResponse.json(inspector);
  } catch (error) {
    console.error("API Error fetching inspector profile:", error);
    return NextResponse.json({ error: "Failed to fetch inspector profile" }, { status: 500 });
  }
}
