import { z } from "zod";

export const donationSchema = z.object({
  food_type: z
    .string()
    .trim()
    .min(2, "Food type must be at least 2 characters")
    .max(100, "Food type is too long"),

  quantity: z
    .string()
    .trim()
    .min(2, "Quantity is required")
    .max(150, "Quantity is too long"),

  lat: z
    .number({
      required_error: "Location is required",
      invalid_type_error: "Location is required",
    })
    .min(-90, "Invalid latitude")
    .max(90, "Invalid latitude"),

  lng: z
    .number({
      required_error: "Location is required",
      invalid_type_error: "Location is required",
    })
    .min(-180, "Invalid longitude")
    .max(180, "Invalid longitude"),
});

export function validateDonation(data) {
  const result = donationSchema.safeParse(data);

  if (!result.success) {
    const errors = {};

    result.error.issues.forEach((issue) => {
      const field = issue.path[0];

      if (field) {
        errors[field] = issue.message;
      }
    });

    return {
      success: false,
      errors,
      data: null,
    };
  }

  return {
    success: true,
    errors: {},
    data: result.data,
  };
}