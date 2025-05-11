// inspector/utils/getAssignedTasks.ts
import { prisma } from "@/lib/db"; // Adjust path to your prisma client
import { cookies } from "next/headers";

export async function getAssignedTasks() {
  const cookieStore = cookies();
  const inspectorId = cookieStore.get("userId")?.value;

  if (!inspectorId) return [];

  try {
    const tasks = await prisma.qualityCheck.findMany({
      where: {
        inspectorId,
      },
      include: {
        productionOrder: true,
      },
      orderBy: {
        checkDate: "desc",
      },
    });

    return tasks;
  } catch (error) {
    console.error("Error fetching assigned tasks:", error);
    return [];
  }
}
