import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { google } from "googleapis";
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      httpOptions: {
        timeout: 10000, // 10 seconds timeout
        retry: 3, // Retry 3 times
        retryDelay: attempt => Math.pow(2, attempt) * 1000, // Exponential backoff (1s, 2s, 4s)
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000, // 1 hour if no expiry set
          user,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to refresh it
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : null
        );

        oauth2Client.setCredentials({
          refresh_token: token.refreshToken,
        });

        const { credentials } = await oauth2Client.refreshAccessToken();

        return {
          ...token,
          accessToken: credentials.access_token,
          accessTokenExpires: Date.now() + (credentials.expires_in || 3600) * 1000,
          // Fall back to old refresh token, but use new if available
          refreshToken: credentials.refresh_token || token.refreshToken,
        };
      } catch (error) {
        console.error("Error refreshing access token", error);
        // The error property will be used client-side to handle the refresh token error
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }
    },
    async session({ session, token }) {
      session.user = token.user;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.error = token.error;
      session.accessTokenExpires = token.accessTokenExpires;
      
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV !== "production", // Enable debug mode only in development
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, metadata) {
      console.error(`NextAuth Error: ${code}`, metadata);
    },
    warn(code) {
      console.warn(`NextAuth Warning: ${code}`);
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
