import { api } from "../clients/server";

type ApiResponse<T> = {
  data: T;
};

export async function safeFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    const res = await api(url, options);

    if (!res.ok) return null;

    const json: ApiResponse<T> = await res.json();

    if (!json?.data) return null;

    return json.data;
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    return null;
  }
}
