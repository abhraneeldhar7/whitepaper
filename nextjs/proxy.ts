import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/p/new"
]);

const isPublicAuthRoute = createRouteMatcher([
  "/login(.*)",
  "/sso(.*)",
]);

const isWelcomeRoute = createRouteMatcher([
  "/welcome(.*)",
]);

const authorizedParties = (process.env.CLERK_AUTHORIZED_PARTIES || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

export default clerkMiddleware(async (auth, req) => {
  const { redirectToSignIn, sessionClaims, userId } = await auth();
  const isAuthenticated = !!userId;
  const url = new URL(req.url);

  const metadata = (sessionClaims as any)?.metadata || {};
  const isOnboardingComplete = metadata?.isOnboardingComplete === true;

  if (!isAuthenticated && (isProtectedRoute(req) || isWelcomeRoute(req))) {
    return redirectToSignIn({ returnBackUrl: url.href });
  }

  if (isAuthenticated && !isOnboardingComplete && isProtectedRoute(req)) {
    return Response.redirect(new URL("/welcome", req.url));
  }

  if (isAuthenticated && isOnboardingComplete && isWelcomeRoute(req)) {
    return Response.redirect(new URL("/dashboard", req.url));
  }

  if (isAuthenticated && isPublicAuthRoute(req)) {
    return Response.redirect(new URL("/dashboard", req.url));
  }
}, { authorizedParties });

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
};
