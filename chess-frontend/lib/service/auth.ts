import { LoginInput, LoginResponse, User } from "@/types/auth";
import { cookies } from "next/headers";
import { baseApi } from "../clients/baseApi";
import { api } from "../clients/server";

export async function signIn(data: LoginInput): Promise<User> {
    const res = await baseApi("/auth/sign-in/email", {
        method: "POST",
        body: data,
    });

    if (!res.ok) {
        const err = await res.json();
        throw err;
    }

    const rawSetCookie = res.headers.get("set-cookie") || "";
    const cookieHeader = rawSetCookie
        ? rawSetCookie.split(/,(?=\s*[^;]+=[^;]+)/)
        : [];

    const cookieStore = await cookies();
    cookieHeader.forEach((cookieString: string) => {
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
                maxAge: 60 * 60 * 24,
            });
        }
    });

    const json = (await res.json()) as LoginResponse;
    return json.user;
}

export async function signOut() {
    const res = await api("/auth/sign-out", {
        method: "POST",
        body: {},
    });

    if (!res.ok) {
        const err = await res.json();
        throw err;
    }

    return await res.json();
}