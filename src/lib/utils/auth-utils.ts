import { Request } from "express";
import * as cookie from "cookie";

export class AuthUtil {
  private static readonly BEARER_PREFIX = "Bearer ";
  private static readonly COOKIE_NAMES = [
    "__Secure-better-auth.session_token",
    "better-auth.session_token",
    "auth_token",
    "session",
  ];

  static extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith(this.BEARER_PREFIX)) {
      return authHeader.substring(this.BEARER_PREFIX.length);
    }

    let parsedCookies = req.cookies;
    if (!parsedCookies && req.headers.cookie) {
      parsedCookies =
        typeof cookie.parseCookie === "function"
          ? cookie.parseCookie(req.headers.cookie)
          : cookie.parse(req.headers.cookie);
    }

    for (const cookieName of this.COOKIE_NAMES) {
      const cookieToken = parsedCookies?.[cookieName];
      if (cookieToken) {
        return cookieToken;
      }
    }

    if (req.query.token && typeof req.query.token === "string") {
      return req.query.token;
    }

    return null;
  }

  static calculateTTL(expiresAt: string | Date): number {
    const now = Date.now();
    const expiry = new Date(expiresAt).getTime();
    const ttlMs = expiry - now;
    const ttlSeconds = Math.floor(ttlMs / 1000);
    return Math.max(ttlSeconds, 0);
  }
}

export const extractToken = AuthUtil.extractToken.bind(AuthUtil);
export const calculateTTL = AuthUtil.calculateTTL.bind(AuthUtil);
