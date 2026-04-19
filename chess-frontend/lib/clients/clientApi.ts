const API_URL = process.env.NEXT_PUBLIC_API_URL;

type SmartBody = BodyInit | Record<string, any> | null | undefined;

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: SmartBody;
};

function normalizeBody(body: SmartBody, headers: HeadersInit | undefined) {
  const finalHeaders: Record<string, string> = {
    ...(headers as any),
  };

  if (
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  ) {
    finalHeaders["Content-Type"] ||= "application/json";
    return { body: JSON.stringify(body), headers: finalHeaders };
  }

  return { body: body as BodyInit | undefined, headers: finalHeaders };
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const { body: finalBody, headers: finalHeaders } = normalizeBody(
    body,
    headers,
  );

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    credentials: "include",
    body: finalBody,
    headers: finalHeaders,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401) {
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/sign-in")
      ) {
        window.location.href = "/sign-in";
      }
    }
    throw data || { error: "No response from server" };
  }

  return data as T;
}
