"use server";

import { api } from "@/lib/clients/server";
import { refreshSession } from "./auth";
import { revalidatePath } from "next/cache";

export async function uploadAvatar(formData: FormData) {
  const res = await api("/user/avatar", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload avatar");
  }

  await refreshSession();
  revalidatePath("/", "layout");
}
