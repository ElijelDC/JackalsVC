import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
        size: z.string().optional(),
      }),
    )
    .min(1, "Cart cannot be empty"),
});

export const trainingSessionSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    location: z.string().min(1, "Location is required"),
    level: z.string().min(1, "Level is required"),
    description: z.string().optional(),
    coach: z.string().optional(),
    attendanceUrl: z.preprocess(
      (val) => (val === "" || val == null ? undefined : val),
      z.string().url("Must be a valid URL").optional(),
    ),
    recurring: z.boolean(),
    recurrenceWeeks: z.number().int().min(1).max(52),
    sessionDate: z.preprocess(
      (val) => (val === "" || val == null ? undefined : val),
      z.string().optional(),
    ),
    recurringFrom: z.preprocess(
      (val) => (val === "" || val == null ? undefined : val),
      z.string().optional(),
    ),
    recurringTo: z.preprocess(
      (val) => (val === "" || val == null ? undefined : val),
      z.string().optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (!data.recurring && !data.sessionDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date is required for one-off sessions",
        path: ["sessionDate"],
      });
    }
    if (data.recurring) {
      if (!data.recurringFrom) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date is required for recurring sessions",
          path: ["recurringFrom"],
        });
      }
      if (!data.recurringTo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date is required for recurring sessions",
          path: ["recurringTo"],
        });
      }
      if (data.recurringFrom && data.recurringTo) {
        const from = new Date(data.recurringFrom);
        const to = new Date(data.recurringTo);
        if (to < from) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End date must be on or after start date",
            path: ["recurringTo"],
          });
        }
      }
    }
  });

export const trainingOccurrenceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  location: z.string().optional(),
  coach: z.string().optional(),
  attendanceUrl: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.string().url("Must be a valid URL").optional(),
  ),
});

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  type: z.enum(["TOURNAMENT", "SOCIAL", "MEETING"]),
  location: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be greater than 0"),
  imageUrl: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  sizes: z.string().optional(),
  stock: z.number().int().min(0),
  active: z.boolean(),
});

export const galleryImageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().min(1, "Image URL is required"),
  category: z.enum(["MATCH", "TRAINING", "SOCIAL", "EVENT"]),
  featured: z.boolean(),
});

export const membershipPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be greater than 0"),
  durationMonths: z.number().int().min(1, "Duration must be at least 1 month"),
  features: z.string().min(1, "At least one feature is required"),
  active: z.boolean(),
});

export const userUpdateSchema = z.object({
  role: z.enum(["MEMBER", "ADMIN"]),
});

export const membershipCreateSchema = z.object({
  userId: z.string().min(1, "User is required"),
  planId: z.string().min(1, "Plan is required"),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]).optional(),
});

export const membershipUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]),
  endDate: z.string().min(1, "End date is required"),
  planId: z.string().optional(),
});

export const orderUpdateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED"]),
});
