import * as z from "zod";

export const inspectorFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(1, {
    message: "Last name must be at least 1 character.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phoneNumber: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  certificationLevel: z.string().optional().nullable(),
  yearsOfExperience: z.coerce.number().int().nonnegative().optional().nullable(),
  isActive: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

export type InspectorFormValues = z.infer<typeof inspectorFormSchema>;

export const CERTIFICATION_LEVELS = [
  "Level 1",
  "Level 2",
  "Level 3",
  "Senior",
  "Expert"
];