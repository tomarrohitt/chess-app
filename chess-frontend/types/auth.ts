import * as z from "zod"

export const loginSchema = z.object({

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

export type LoginInput = z.infer<typeof loginSchema>;


export type User = {
    id: string;
    email: string;
    name: string;
    username: string,
    wins: number;
    losses: number;
    draws: number;
    image?: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt?: string;

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