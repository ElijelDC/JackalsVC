import { z } from "zod";

export const validateVlySchema = z.object({
  vlyNumber: z.string().min(3, "VLY number is required"),
});

export const sendEmailCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  vlyNumber: z.string().min(3, "VLY number is required"),
  registrationToken: z.string().min(1, "Registration session expired"),
});

export const verifyEmailCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  vlyNumber: z.string().min(3, "VLY number is required"),
  registrationToken: z.string().min(1, "Registration session expired"),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const registerSchema = z
  .object({
    vlyNumber: z.string().min(3, "VLY number is required"),
    registrationToken: z.string().min(1, "Registration session expired"),
    email: z.string().email("Invalid email address"),
    emailCode: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

import { PAYMENT_SCHEDULES } from "@/lib/membership-config";

export const eventSignupSchema = z.object({
  eventId: z.string().min(1, "Event ID required"),
  status: z.enum(["ATTENDING", "NOT_ATTENDING"]).optional(),
});

export const matchSignupSchema = z.object({
  matchId: z.string().min(1, "Match ID required"),
  status: z.enum(["ATTENDING", "NOT_ATTENDING"]).optional(),
});

export const membershipSubscribeSchema = z.object({
  paymentSchedule: z.enum(PAYMENT_SCHEDULES, {
    error: "Choose a payment option",
  }),
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
    paymentUrl: z.preprocess(
      (val) => (val === "" || val == null ? undefined : val),
      z.string().url("Must be a valid URL").optional(),
    ),
    reclubUsername: z.preprocess(
      (val) => (val === "" || val == null ? undefined : val),
      z.string().min(1).optional(),
    ),
    sessionFee: z.preprocess(
      (val) => (val === "" || val == null ? undefined : val),
      z.coerce
        .number()
        .positive("Session fee must be greater than zero")
        .optional(),
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
    trainingTeamKey: z.preprocess(
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
    (val) => (val === "" || val === undefined ? null : val),
    z.union([z.string().url("Must be a valid URL"), z.null()]).optional(),
  ),
  paymentUrl: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.union([z.string().url("Must be a valid URL"), z.null()]).optional(),
  ),
});

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  type: z.enum(["TOURNAMENT", "SOCIAL", "MEETING"]),
  location: z.string().optional(),
  attendanceUrl: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.string().url("Must be a valid URL").optional(),
  ),
  paymentUrl: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.string().url("Must be a valid URL").optional(),
  ),
  sessionFee: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.coerce
      .number()
      .positive("Session fee must be greater than zero")
      .optional(),
  ),
  reclubUsername: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.string().min(1).optional(),
  ),
  clubIban: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.string().min(1).optional(),
  ),
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

export const galleryAlbumSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z
    .string()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  coverImageUrl: z.string().min(1, "Cover image URL is required"),
  category: z.enum(["MATCH", "TRAINING", "SOCIAL", "EVENT"]),
  featured: z.boolean(),
  sortOrder: z.number().int().min(0).default(0),
});

export const galleryPhotoSchema = z.object({
  title: z
    .string()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  caption: z
    .string()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  imageUrl: z.string().min(1, "Image URL is required"),
  sortOrder: z.number().int().min(0).default(0),
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

export const clubMemberCreateSchema = z.object({
  vlyNumber: z.string().min(3, "VLY number is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  active: z.boolean().optional(),
});

export const clubMemberUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  active: z.boolean().optional(),
  trainingTeamKey: z.string().nullable().optional(),
});

export const orderUpdateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED"]),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const achievementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  season: z.string().min(1, "Season is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z
    .string()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  sortOrder: z.number().int().min(0).default(0),
  type: z.enum(["LEAGUE", "TOURNAMENT"]).default("TOURNAMENT"),
});

export const clubTeamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  level: z.string().min(1, "Level is required"),
  description: z.string().min(1, "Description is required"),
  details: z
    .string()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  sortOrder: z.number().int().min(0).default(0),
});

export const clubTeamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.enum(["PLAYER", "COACH"]),
  position: z
    .string()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  photoUrl: z
    .string()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  sortOrder: z.number().int().min(0).default(0),
});

import { MATCH_VENUES } from "@/lib/match-config";
import { isTrainingTeamKey } from "@/lib/training-teams-config";

export const teamMatchSchema = z
  .object({
    trainingTeamKey: z.string().min(1, "Squad is required"),
    opponentName: z.string().min(1, "Opponent name is required"),
    venue: z.enum(MATCH_VENUES),
    location: z.string().min(1, "Location is required"),
    warmUpTime: z.string().min(1, "Warm-up time is required"),
    matchStart: z.string().min(1, "Match start is required"),
    notes: z
      .string()
      .optional()
      .transform((val) => (val?.trim() ? val.trim() : undefined)),
  })
  .refine((data) => isTrainingTeamKey(data.trainingTeamKey), {
    message: "Select a valid squad",
    path: ["trainingTeamKey"],
  })
  .refine(
    (data) => new Date(data.matchStart).getTime() >= new Date(data.warmUpTime).getTime(),
    {
      message: "Match start must be after warm-up time",
      path: ["matchStart"],
    },
  );
