import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.INTERNAL_API_URL;

type SmartBody = BodyInit | Record<string, any> | null | undefined;

type NextFetchOptions = Omit<RequestInit, "body"> & {
    body?: SmartBody;
    next?: {
        revalidate?: number | false;
        tags?: string[];
    };
    cache?: RequestCache;
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

export async function api(endpoint: string, options: NextFetchOptions = {}) {
    const { body, headers: optionHeaders, ...rest } = options;

    const { body: finalBody, headers: finalHeaders } = normalizeBody(
        body,
        optionHeaders,
    );

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
        finalHeaders["Cookie"] = cookieHeader;
    }

    const headersList = await headers();
    const incomingOrigin = headersList.get("origin");

    const origin = incomingOrigin || process.env.NEXT_PUBLIC_ORIGIN_URL;

    if (origin) {
        finalHeaders["Origin"] = origin;
    }

    const fullUrl = `${API_URL}${endpoint}`;

    const res = await fetch(fullUrl, {
        ...rest,
        headers: finalHeaders,
        body: finalBody,
    });

    if (res.status === 401) {
        redirect("/sign-in");
    }

    return res;
}