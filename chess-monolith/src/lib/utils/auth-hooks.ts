import { APIError } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";

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

interface AuthErrorResponse {
  status?: ConstructorParameters<typeof APIError>[0];
  body?: {
    code?: string;
    message?: string;
  };
}

export const authHooks: BetterAuthOptions["hooks"] = {
  before: createAuthMiddleware(async (ctx) => {
    let schema = null;
    if (ctx.path === "/sign-up/email") schema = registrationSchema;
    if (ctx.path === "/sign-in/email") schema = loginSchema;
    if (!schema) return;

    const result = schema.safeParse(ctx.body);

    if (!result.success) {
      const formatted = result.error.issues.map((issue) => ({
        field: issue.path[0],
        message: issue.message,
      }));

      throw new APIError("BAD_REQUEST", {
        success: false,
        errors: formatted,
      });
    }

    ctx.body = result.data;
  }),

  after: createAuthMiddleware(async (ctx) => {
    const response = ctx.context.returned as AuthErrorResponse | undefined;
    if (response && typeof response === "object" && response.body) {
      const body = response.body;
      if (body.code && body.message) {
        throw new APIError(
          response.status ||
            ("INTERNAL_SERVER_ERROR" as ConstructorParameters<
              typeof APIError
            >[0]),
          {
            success: false,
            errors: [
              {
                message: body.message,
              },
            ],
          },
        );
      }
    }
  }),
};
