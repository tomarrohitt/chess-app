"use server";

import { api } from "@/lib/clients/server";
import { signIn } from "@/lib/service/auth";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import z from "zod";
import { LoginInput, loginSchema, User } from "@/types/auth";
import { simplifyZodErrors } from "@/lib/constants/error-simplifier";
import { safeFetch } from "@/lib/constants/safe-fetch";
import { ChatUserInfo } from "@/types/chat";

export async function login(
  redirectTo: string,
  _: unknown,
  formData: FormData,
) {
  const data = Object.fromEntries(formData) as LoginInput;
  const result = loginSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors = z.treeifyError(result.error);

    return {
      success: false,
      message: "Validation failed",
      errors: simplifyZodErrors(formattedErrors),
      inputs: {
        email: data.email,
        password: "",
      },
    };
  }

  try {
    await signIn(result.data);
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        message: error.message,
        errors: {
          email: "",
          password: "",
        },
        inputs: {
          email: data.email,
          password: "",
        },
      };
    }
    return {
      success: false,
      message: error.errors[0].message as string,
      errors: {
        email: "",
        password: "",
      },
      inputs: {
        email: data.email,
        password: "",
      },
    };
  }
  redirect(redirectTo);
}

export async function logout() {
  try {
    await api("/auth/sign-out", {
      method: "POST",
      body: {},
      headers: {
        Origin: process.env.NEXT_PUBLIC_ORIGIN_URL || "http://localhost:3000",
      },
    });
  } catch (error) {}
  const cookieStore = await cookies();
  cookieStore.getAll().forEach((cookie) => {
    cookieStore.delete(cookie.name);
  });
  redirect("/login");
}

export async function fetchUserById(userId: string) {
  const user = await safeFetch<ChatUserInfo>(`/user/${userId}`);
  return user;
}
export async function getUserById(userId: string) {
  const user = await safeFetch<Omit<User, "emailVerified">>(
    `/user/profile/${userId}`,
  );
  return user;
}
export async function getUserImage(filename: string) {
  const image = await safeFetch<string>(`/user/avatar/${filename}`);
  return image;
}
