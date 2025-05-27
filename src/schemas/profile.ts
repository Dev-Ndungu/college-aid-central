
import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string()
    .min(1, "Full name is required")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  institution: z.string()
    .max(200, "Institution name must be less than 200 characters")
    .trim()
    .optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  phone_number: z.string()
    .max(20, "Phone number must be less than 20 characters")
    .trim()
    .optional(),
  institution_type: z.string()
    .max(50, "Institution type must be less than 50 characters")
    .trim()
    .optional()
});

export const writerProfileSchema = z.object({
  writer_bio: z.string()
    .max(500, "Bio must be less than 500 characters")
    .trim()
    .optional(),
  writer_skills: z.string()
    .max(1000, "Skills must be less than 1000 characters")
    .trim()
    .optional()
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type WriterProfileInput = z.infer<typeof writerProfileSchema>;
