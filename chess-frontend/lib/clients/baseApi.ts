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
  customHeaders: HeadersInit | undefined,
) {
  const finalHeaders = new Headers(customHeaders);

  if (
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  ) {
    if (!finalHeaders.has("Content-Type")) {
      finalHeaders.set("Content-Type", "application/json");
    }
    return { body: JSON.stringify(body), headers: finalHeaders };
  }

  return { body: body as BodyInit | undefined, headers: finalHeaders };
}

export async function baseApi(
  endpoint: string,
  options: NextFetchOptions = {},
) {
  const { body, headers, ...rest } = options;

  const normalized = normalizeBody(body, headers);

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    credentials: "omit",
    body: normalized.body,
    headers: {
      ...normalized.headers,
      Origin: ORIGIN_URL ?? "https://rohit-ecommerce-microservice.dedyn.io",
    },
  });

  return res;
}
