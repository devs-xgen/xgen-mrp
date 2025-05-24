// inspector/utils/updateStatus.ts
import { prisma } from "@/lib/db"; // Adjust path
import { revalidatePath } from "next/cache"; // Optional, for ISR pages
import type { NextApiRequest, NextApiResponse } from "next";

type UpdateInput = {
  qualityCheckId: string;
  status: "ACTIVE" | "INACTIVE" | "COMPLETED"; // Adjust if you have an enum
  defectsFound?: string;
  actionTaken?: string;
  notes?: string;
  modifiedBy: string;
};

export async function updateStatus(input: UpdateInput) {
  const { qualityCheckId, status, defectsFound, actionTaken, notes, modifiedBy } = input;

  try {
    const updated = await prisma.qualityCheck.update({
      where: {
        id: qualityCheckId,
      },
      data: {
        status,
        defectsFound,
        actionTaken,
        notes,
        modifiedBy,
      },
    });

    // Optional: revalidate the relevant path/page after update
    revalidatePath("/inspector/task");

    return updated;
  } catch (error) {
    console.error("Error updating QualityCheck:", error);
    throw error;
  }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.status(405).end();
  
    try {
      const data = JSON.parse(req.body);
      const updated = await updateStatus(data);
      return res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  