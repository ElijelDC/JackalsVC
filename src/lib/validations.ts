import { z } from "zod";
import { COACH_PAYMENT_TYPES } from "@/lib/coach-payment-type";

/** Preprocess empty strings/null/undefined → undefined for optional Zod fields */
const emptyToUndefined = (val: unknown) =>
  val === "" || val == null ? undefined : val;

/** Preprocess empty strings/undefined → null for nullable Zod fields */
const emptyToNull = (val: unknown) =>
  val === "" || val === undefined ? null : val;

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
  planId: z.string().min(1, "Choose a membership type"),
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
    attendanceUrl: z.preprocess(emptyToUndefined,
      z.string().url("Must be a valid URL").optional(),
    ),
    paymentUrl: z.preprocess(emptyToUndefined,
      z.string().url("Must be a valid URL").optional(),
    ),
    reclubUsername: z.preprocess(emptyToUndefined,
      z.string().min(1).optional(),
    ),
    sessionFee: z.preprocess(emptyToUndefined,
      z.coerce
        .number()
        .positive("Session fee must be greater than zero")
        .optional(),
    ),
    recurring: z.boolean(),
    recurrenceWeeks: z.number().int().min(1).max(52),
    sessionDate: z.preprocess(emptyToUndefined,
      z.string().optional(),
    ),
    recurringFrom: z.preprocess(emptyToUndefined,
      z.string().optional(),
    ),
    recurringTo: z.preprocess(emptyToUndefined,
      z.string().optional(),
    ),
    trainingTeamKey: z.preprocess(emptyToUndefined,
      z.string().optional(),
    ),
    notifyMembers: z.boolean().optional(),
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
  attendanceUrl: z.preprocess(emptyToNull,
    z.union([z.string().url("Must be a valid URL"), z.null()]).optional(),
  ),
  paymentUrl: z.preprocess(emptyToNull,
    z.union([z.string().url("Must be a valid URL"), z.null()]).optional(),
  ),
});

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  type: z.enum(["TOURNAMENT", "SKILLS_CLINIC", "SOCIAL"]),
  location: z.string().optional(),
  attendanceUrl: z.preprocess(emptyToUndefined,
    z.string().url("Must be a valid URL").optional(),
  ),
  paymentUrl: z.preprocess(emptyToUndefined,
    z.string().url("Must be a valid URL").optional(),
  ),
  sessionFee: z.preprocess(emptyToUndefined,
    z.coerce
      .number()
      .positive("Session fee must be greater than zero")
      .optional(),
  ),
  reclubUsername: z.preprocess(emptyToUndefined,
    z.string().min(1).optional(),
  ),
  clubIban: z.preprocess(emptyToUndefined,
    z.string().min(1).optional(),
  ),
  notifyMembers: z.boolean().optional(),
});

export const eventNewsletterSubscribeSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  source: z.enum(["homepage", "footer", "profile"]).optional(),
});

export const eventNewsletterPreferenceSchema = z.object({
  subscribed: z.boolean(),
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
  coverImageUrl: z
    .string()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
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
  active: z.boolean(),
});

export const userUpdateSchema = z.object({
  role: z.enum(["MEMBER", "ADMIN"]),
});

export const profilePlayerNumberSchema = z.object({
  playerNumber: z
    .number()
    .int("Player number must be a whole number.")
    .min(1, "Player number must be between 1 and 99.")
    .max(99, "Player number must be between 1 and 99.")
    .nullable(),
});

export const profileEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address."),
});

export const profileEmailSendCodeSchema = profileEmailSchema;

export const profileEmailUpdateSchema = profileEmailSchema.extend({
  emailCode: z
    .string()
    .regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSendCodeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address."),
});

export const forgotPasswordResetSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address."),
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

export const membershipCreateSchema = z.object({
  userId: z.string().min(1, "User is required"),
  planId: z.string().min(1, "Plan is required"),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "COACH"]).optional(),
});

export const membershipUpdateSchema = z
  .object({
    status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "COACH"]),
    endDate: z.string().min(1, "End date is required"),
    planId: z.string().optional(),
    paymentOverdueOverride: z.boolean().optional(),
    paymentOverdueOverrideNote: z.string().max(500).nullable().optional(),
    paymentOverdueOverrideUntil: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentOverdueOverride && !data.paymentOverdueOverrideUntil) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose when the override should end",
        path: ["paymentOverdueOverrideUntil"],
      });
    }
  });

export const paymentDeferralRequestSchema = z.object({
  excuse: z
    .string()
    .trim()
    .min(10, "Please explain why you need more time (at least 10 characters)")
    .max(1000),
  dueDate: z.string().min(1, "Choose when you expect to pay"),
});

export const clubMemberCreateSchema = z.object({
  vlyNumber: z.string().min(3, "VLY number is required"),
  name: z.string().min(2, "Full name is required"),
  trainingTeamKey: z.string().min(1, "Team is required"),
  rosterRole: z.enum(["PLAYER", "COACH"]).default("PLAYER"),
  coachPaymentType: z.enum(COACH_PAYMENT_TYPES).optional(),
  active: z.boolean().optional(),
});

export const clubMemberUpdateSchema = z.object({
  vlyNumber: z.string().min(3).optional(),
  name: z.string().min(2).optional(),
  active: z.boolean().optional(),
  rosterRole: z.enum(["PLAYER", "COACH"]).optional(),
  coachPaymentType: z.enum(COACH_PAYMENT_TYPES).nullable().optional(),
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

export const coachingApplicationSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  age: z.coerce
    .number({ message: "Enter your age" })
    .int("Age must be a whole number")
    .min(16, "You must be at least 16")
    .max(99, "Enter a valid age"),
  contactNumber: z
    .string()
    .min(7, "Enter a valid contact number")
    .max(30, "Contact number is too long"),
  contactEmail: z.string().email("Enter a valid email address"),
  qualificationLevel: z.enum(["NONE", "FOUNDATION", "LEVEL_1", "LEVEL_2"], {
    message: "Select your VLY Ireland coach level",
  }),
  yearsExperience: z.coerce
    .number({ message: "Enter years of experience" })
    .int("Years of experience must be a whole number")
    .min(0, "Years of experience cannot be negative")
    .max(60, "Enter a valid number of years"),
  canCommuteToBothVenues: z.enum(["YES", "NO", "ONE_VENUE"], {
    message: "Please answer the commute question",
  }),
  whyInterested: z
    .string()
    .min(20, "Tell us a little more about why you want to coach (at least 20 characters)")
    .max(2000, "Please keep your answer under 2000 characters"),
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
  trainingTeamKey: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val?.trim() ? val.trim() : null)),
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
  isCaptain: z.boolean().optional().default(false),
  hidden: z.boolean().optional().default(false),
});

export const clubTeamMemberDisplaySchema = z.object({
  position: z
    .string()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  sortOrder: z.number().int().min(0).optional(),
  isCaptain: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

import { MATCH_VENUES } from "@/lib/match-config";

export const trainingSquadCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
  key: z
    .string()
    .min(1)
    .max(48)
    .regex(/^[A-Z0-9_]+$/, "Key must use uppercase letters, numbers, and underscores")
    .optional(),
});

export const trainingSquadUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

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
  .refine(
    (data) => new Date(data.matchStart).getTime() >= new Date(data.warmUpTime).getTime(),
    {
      message: "Match start must be after warm-up time",
      path: ["matchStart"],
    },
  );

export const coachTrainingUpdateSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
  recurringFrom: z.string().optional(),
  recurringTo: z.string().optional(),
});

export const coachTrainingOccurrenceSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
});

export const adminTrainingScheduleUpdateSchema = coachTrainingUpdateSchema.extend({
  teamKey: z.string().min(1, "Team is required"),
});

export const coachClinicSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  location: z.string().optional(),
  attendanceUrl: z.preprocess(emptyToUndefined,
    z.string().url("Must be a valid URL").optional(),
  ),
  paymentUrl: z.preprocess(emptyToUndefined,
    z.string().url("Must be a valid URL").optional(),
  ),
  sessionFee: z.preprocess(emptyToUndefined,
    z.coerce
      .number()
      .positive("Session fee must be greater than zero")
      .optional(),
  ),
  reclubUsername: z.preprocess(emptyToUndefined,
    z.string().min(1).optional(),
  ),
});

export const coachSalaryPaymentUpdateSchema = z.object({
  sessionCount: z.coerce.number().int().min(0, "Session count cannot be negative"),
  status: z.enum(["PENDING", "PAID"]).optional(),
  notes: z
    .string()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
});

export const clientErrorReportSchema = z.object({
  message: z.string().min(1).max(500),
  url: z.string().max(2000).optional(),
  endpoint: z.string().max(500).optional(),
  status: z.number().int().min(100).max(599).optional(),
  stack: z.string().max(2000).optional(),
  component: z.string().max(200).optional(),
});
