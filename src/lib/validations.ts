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

export const trainingSessionSchema = z.object({
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
});

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  type: z.enum(["TRAINING", "TOURNAMENT", "SOCIAL", "MEETING"]),
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
