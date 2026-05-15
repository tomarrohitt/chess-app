"use server";

import { api } from "@/lib/clients/server";
import { signIn, signUp } from "@/lib/service/auth";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import z from "zod";
import {
  LoginInput,
  loginSchema,
  RegisterInput,
  registrationSchema,
  User,
} from "@/types/auth";
import {
  handleServerApiError,
  simplifyZodErrors,
} from "@/lib/constants/error-simplifier";
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
        password: data.password,
      },
    };
  }

  try {
    await signIn(result.data);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error instanceof Error, { error });
      return {
        success: false,
        message: error.message,
        errors: {
          email: "",
          password: "",
        },
        inputs: {
          email: data.email,
          password: data.password,
        },
      };
    }
    return {
      success: false,
      message: handleServerApiError(error),
      errors: {
        email: "",
        password: "",
      },
      inputs: {
        email: data.email,
        password: data.password,
      },
    };
  }
  redirect(redirectTo);
}

export async function register(_: unknown, formData: FormData) {
  const data = Object.fromEntries(formData) as RegisterInput;
  const result = registrationSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors = z.treeifyError(result.error);
    return {
      success: false,
      message: "Validation failed",
      errors: simplifyZodErrors(formattedErrors),
      inputs: {
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
      },
    };
  }

  try {
    await signUp(result.data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {
        success: false,
        message: error.message,
        errors: {
          name: "",
          username: "",
          email: "",
          password: "",
        },
        inputs: {
          name: data.name,
          username: data.username,
          email: data.email,
          password: data.password,
        },
      };
    }
    return {
      success: false,
      message: handleServerApiError(error),
      errors: {
        name: "",
        username: "",
        email: "",
        password: "",
      },
      inputs: {
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
      },
    };
  }

  redirect("/");
}

export async function getSession(): Promise<{ user: User } | null> {
  try {
    const res = await api("/auth/get-session");

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}

export async function refreshSession() {
  const res = await api("/auth/get-session", {
    headers: {
      "x-skip-cache": "true",
    },
  });

  if (!res.ok) return;

  const rawSetCookie = res.headers.get("set-cookie");
  if (!rawSetCookie) return;

  const cookieStore = await cookies();
  const cookieHeaders = rawSetCookie.split(/,(?=\s*[^;]+=[^;]+)/);

  cookieHeaders.forEach((cookieString) => {
    const [nameValue] = cookieString.split(";");
    const [name, ...rest] = nameValue.split("=");
    const value = rest.join("=");

    if (name && value) {
      const cleanValue = decodeURIComponent(value);

      cookieStore.set({
        name: name.trim(),
        value: cleanValue,
        httpOnly: true,
        path: "/",
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  });
}

export async function logout() {
  await api("/auth/sign-out", {
    method: "POST",
    body: {},
    headers: {
      Origin: process.env.NEXT_PUBLIC_ORIGIN_URL || "http://localhost:3000",
    },
  });
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
