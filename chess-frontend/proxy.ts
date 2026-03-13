import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isServerAction = request.headers.get("Next-Action");
  const isRSCRequest = request.headers.get("RSC");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");

  const shouldSkipRedirect = isServerAction || isRSCRequest || isApiRoute;

  const sessionToken = request.cookies.get("better-auth.session_token");
  const sessionData = request.cookies.get("better-auth.session_data");

  let isValidSession = false;

  if (sessionToken && sessionData) {
    try {
      const jsonString = atob(sessionData.value);
      JSON.parse(jsonString);
      isValidSession = true;
    } catch {
      isValidSession = false;
    }
  }

  // 1. Fix the paths (added the slash to /game)
  const authPaths = ["/login", "/register"];
  const protectedPaths = ["/", "/game"];

  const isAuthRoute = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 2. Fix the Wildcard Trap
  const isProtectedRoute = protectedPaths.some((path) => {
    if (path === "/") {
      return request.nextUrl.pathname === "/"; // Exact match for root
    }
    return request.nextUrl.pathname.startsWith(path);
  });

  if (shouldSkipRedirect) {
    const response = NextResponse.next();
    if ((sessionToken || sessionData) && !isValidSession) {
      response.cookies.delete("better-auth.session_token");
      response.cookies.delete("better-auth.session_data");
    }
    return response;
  }

  // 3. Handle Auth Routes FIRST
  if (isAuthRoute) {
    if (isValidSession) {
      // If logged in, send them to the dashboard/home
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }

    // If cookies are invalid, clear them but let them stay on /login
    if (!isValidSession && (sessionToken || sessionData)) {
      const response = NextResponse.next();
      response.cookies.delete("better-auth.session_token");
      response.cookies.delete("better-auth.session_data");
      return response;
    }

    return NextResponse.next();
  }

  // 4. Handle Protected Routes
  if (isProtectedRoute && !isValidSession) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/login";
    signInUrl.searchParams.set("redirect", request.nextUrl.pathname);

    const response = NextResponse.redirect(signInUrl);

    if (sessionToken || sessionData) {
      response.cookies.delete("better-auth.session_token");
      response.cookies.delete("better-auth.session_data");
    }

    return response;
  }

  return NextResponse.next();
}

// Removed /login from the exclusion list so the proxy can handle redirecting
// logged-in users away from the login page!
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}