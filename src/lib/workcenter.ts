import * as z from "zod";
import { Status } from "@prisma/client";

export const workCenterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  capacityPerHour: z.number().min(1, "Capacity per hour is required"),
  operatingHours: z.number().min(1, "Operating hours are required"),
  efficiencyRate: z.number().min(0, "Efficiency rate is required"),
  status: z.nativeEnum(Status),
});

export type WorkCenterFormValues = z.infer<typeof workCenterSchema>;
