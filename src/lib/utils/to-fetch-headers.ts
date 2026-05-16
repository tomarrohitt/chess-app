import { IncomingHttpHeaders } from "node:http";

export function toFetchHeaders(headers: IncomingHttpHeaders): Headers {
  const result = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") {
      result.set(key, value);
    }
  }

  return result;
}
