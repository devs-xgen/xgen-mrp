"use server";

import { prisma } from "@/lib/db";
import { Status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ensureSuperAdmin } from "./index";

type MaterialTypeInput = {
  name: string;
  description?: string | null;
  status: Status;
};

export async function getSuperAdminMaterialTypesList() {
  await ensureSuperAdmin();

  return prisma.materialType.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function createMaterialTypeForSuperAdmin(data: MaterialTypeInput) {
  await ensureSuperAdmin();

  const result = await prisma.materialType.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      status: data.status,
    },
  });

  revalidatePath("/superadmin/materials");
  return result;
}

export async function updateMaterialTypeForSuperAdmin(
  id: string,
  data: MaterialTypeInput,
) {
  await ensureSuperAdmin();

  const result = await prisma.materialType.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? null,
      status: data.status,
    },
  });

  revalidatePath("/superadmin/materials");
  return result;
}

export async function deleteMaterialTypeForSuperAdmin(id: string) {
  await ensureSuperAdmin();

  const materialsUsingType = await prisma.material.count({
    where: { typeId: id },
  });

  if (materialsUsingType > 0) {
    throw new Error(
      `Cannot delete this material type as it is used by ${materialsUsingType} materials`,
    );
  }

  await prisma.materialType.delete({
    where: { id },
  });

  revalidatePath("/superadmin/materials");
}
