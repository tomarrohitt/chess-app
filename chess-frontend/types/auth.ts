import * as z from "zod";

export const registrationSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .min(1, "Name is required")
    .trim()
    .min(3, "Must be at least 3 characters")
    .max(128, "Must not exceed 128 characters"),
  username: z
    .string({ error: "Username is required" })
    .min(1, "Username is required")
    .trim()
    .min(3, "Must be at least 3 characters")
    .max(128, "Must not exceed 128 characters"),
  email: z
    .string({ error: "Email is required" })
    .min(1, "Email is required")
    .trim()
    .toLowerCase()
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      error: "Must be a valid email address",
    }),
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Must be at least 8 characters")
    .max(128, "Must not exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Must contain uppercase, lowercase, number, and special character",
    ),
});

export const loginSchema = registrationSchema.omit({
  name: true,
  username: true,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registrationSchema>;

export type User = {
  id: string;
  email: string;
  name: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  image: string | null;
  rating: number;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt?: Date;
};

export type AuthResponse = {
  user: User;
  session: {
    token: string;
    expiresAt: string;
  };
};

export type LoginResponse = {
  user: User;
  token: string;
  redirect: boolean;
};
