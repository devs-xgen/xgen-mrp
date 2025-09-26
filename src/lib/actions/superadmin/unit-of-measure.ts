"use server";

import { prisma } from "@/lib/db";
import { Status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ensureSuperAdmin } from "./index";

type UnitOfMeasureInput = {
  name: string;
  symbol: string;
  description?: string | null;
  status: Status;
};

export async function getSuperAdminUnitOfMeasureList() {
  await ensureSuperAdmin();

  return prisma.unitOfMeasure.findMany({
    select: {
      id: true,
      name: true,
      symbol: true,
      description: true,
      status: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function createUnitOfMeasureForSuperAdmin(
  data: UnitOfMeasureInput,
) {
  await ensureSuperAdmin();

  const result = await prisma.unitOfMeasure.create({
    data: {
      name: data.name,
      symbol: data.symbol,
      description: data.description ?? null,
      status: data.status,
    },
  });

  revalidatePath("/superadmin/materials");
  return result;
}

export async function updateUnitOfMeasureForSuperAdmin(
  id: string,
  data: UnitOfMeasureInput,
) {
  await ensureSuperAdmin();

  const result = await prisma.unitOfMeasure.update({
    where: { id },
    data: {
      name: data.name,
      symbol: data.symbol,
      description: data.description ?? null,
      status: data.status,
    },
  });

  revalidatePath("/superadmin/materials");
  return result;
}

export async function deleteUnitOfMeasureForSuperAdmin(id: string) {
  await ensureSuperAdmin();

  const materialsUsingUnit = await prisma.material.count({
    where: { unitOfMeasureId: id },
  });

  if (materialsUsingUnit > 0) {
    throw new Error(
      `Cannot delete this unit of measure as it is used by ${materialsUsingUnit} materials`,
    );
  }

  await prisma.unitOfMeasure.delete({
    where: { id },
  });

  revalidatePath("/superadmin/materials");
}
