const API_URL = process.env.INTERNAL_API_URL;
const ORIGIN_URL = process.env.NEXT_PUBLIC_ORIGIN_URL;

type SmartBody = BodyInit | Record<string, unknown> | null | undefined;

type NextFetchOptions = Omit<RequestInit, "body"> & {
  body?: SmartBody;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  cache?: RequestCache;
};

function normalizeBody(
  body: SmartBody,
  customHeaders?: HeadersInit,
): { body?: BodyInit; headers: Headers } {
  const headers = new Headers(customHeaders);

  if (
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  ) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return {
      body: JSON.stringify(body),
      headers,
    };
  }

  return { body: body as BodyInit | undefined, headers };
}

export async function baseApi(
  endpoint: string,
  options: NextFetchOptions = {},
): Promise<Response> {
  const { body, headers: optionHeaders, ...rest } = options;

  const { body: finalBody, headers: finalHeaders } = normalizeBody(
    body,
    optionHeaders,
  );

  if (!finalHeaders.has("Origin")) {
    finalHeaders.set("Origin", ORIGIN_URL ?? "http://localhost:3000");
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...rest,
    credentials: "omit",
    body: finalBody,
    headers: finalHeaders,
  });
}
