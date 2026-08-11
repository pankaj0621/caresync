import { z } from "zod";

export const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address"),

  phone: z
    .string()
    .trim()
    .regex(
      /^[6-9]\d{9}$/,
      "Enter a valid 10-digit Indian mobile number"
    ),

  organization_name: z
    .string()
    .trim()
    .max(120, "Organization name is too long")
    .optional(),

  role: z.enum(["donor", "consumer", "both"]),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters"),
});