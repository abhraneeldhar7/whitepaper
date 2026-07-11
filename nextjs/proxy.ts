import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
]);

const isPublicAuthRoute = createRouteMatcher([
  "/login(.*)",
  "/welcome(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { redirectToSignIn, isAuthenticated } = await auth();
  const url = new URL(req.url);

  if (!isAuthenticated && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: url.href });
  }

  if (isAuthenticated && isPublicAuthRoute(req)) {
    const searchParams = url.searchParams;
    const redirectTarget = searchParams.get("redirect_url") || "/dashboard";
    return Response.redirect(new URL(redirectTarget, req.url));
  }
});

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
