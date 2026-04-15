import { User } from "@/types/auth";
import { ChatUserInfo } from "@/types/chat";
import { cookies } from "next/headers";

export async function getTokenFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("better-auth.session_token");
  if (!token) return null;

  return token.value;
}

export async function getUserFromSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("better-auth.session_data");
  const sessionToken = cookieStore.get("better-auth.session_token");

  if (!sessionData || !sessionToken) {
    return null;
  }

  try {
    const jsonString = Buffer.from(sessionData.value, "base64").toString(
      "utf-8",
    );
    const data = JSON.parse(jsonString);

    const expiresAt = new Date(data.session.expiresAt);
    if (new Date() > expiresAt) {
      throw new Error("Session expired");
    }

    return data.session.user;
  } catch (error) {
    cookieStore.delete("better-auth.session_data");
    cookieStore.delete("better-auth.session_token");
    return null;
  }
}
