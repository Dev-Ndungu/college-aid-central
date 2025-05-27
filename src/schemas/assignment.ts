
import { z } from "zod";

// Strict validation schema for assignment creation
export const createAssignmentSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  description: z.string()
    .max(2000, "Description must be less than 2000 characters")
    .trim()
    .optional(),
  subject: z.string()
    .min(1, "Subject is required")
    .max(100, "Subject must be less than 100 characters")
    .trim(),
  assignment_type: z.string()
    .max(50, "Assignment type must be less than 50 characters")
    .trim()
    .optional(),
  due_date: z.string()
    .datetime("Invalid date format")
    .optional()
    .transform((val) => val ? new Date(val).toISOString() : undefined),
  price: z.number()
    .min(0, "Price cannot be negative")
    .max(10000, "Price cannot exceed $10,000")
    .optional(),
  student_name: z.string()
    .max(100, "Name must be less than 100 characters")
    .trim()
    .optional(),
  student_email: z.string()
    .email("Invalid email format")
    .max(100, "Email must be less than 100 characters")
    .trim()
    .optional(),
  student_phone: z.string()
    .max(20, "Phone must be less than 20 characters")
    .trim()
    .optional(),
  file_urls: z.array(z.string().url("Invalid file URL")).optional()
});

export const updateAssignmentSchema = createAssignmentSchema.partial().extend({
  id: z.string().uuid("Invalid assignment ID"),
  status: z.enum(['submitted', 'in_progress', 'completed', 'cancelled']).optional(),
  grade: z.string().max(10, "Grade must be less than 10 characters").optional(),
  progress: z.number().min(0).max(100).optional()
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
