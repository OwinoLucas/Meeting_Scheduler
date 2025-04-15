// Simple middleware configuration to protect API routes
import { withAuth } from "next-auth/middleware";

// Use withAuth without a custom function to simplify
export default withAuth({
  pages: {
    signIn: "/auth/signin",
  }
});

// Specify exactly which paths to protect with middleware
export const config = {
  matcher: [
    // Protected API routes
    "/api/meetings",
    // Skip auth routes
    "/((?!api/auth|auth/signin|_next/static|_next/image|favicon.ico).*)",
  ],
};
