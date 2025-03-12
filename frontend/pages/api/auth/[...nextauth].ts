// ... existing imports ...

import NextAuth, { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import FacebookProvider from 'next-auth/providers/facebook';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken: string;
    error?: 'TokenExpired';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    userId?: string;
    error?: 'TokenExpired';
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'email,ads_management,ads_read,business_management,public_profile'
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] Sign in callback:', { user, account, profile });
      
      // If we have a Facebook access token from the SDK, use it
      if (account?.provider === 'facebook') {
        return true;
      }
      return false;
    },
    async jwt({ token, user, account }) {
      console.log('[NextAuth] JWT callback:', { token, user, account });
      
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          userId: user.id,
        };
      }

      // Return previous token if it hasn't expired
      if (token.exp && Date.now() < (token.exp as number * 1000)) {
        return token;
      }

      // Token has expired, but we need to return a valid JWT
      return {
        ...token,
        error: 'TokenExpired'
      };
    },
    async session({ session, token }) {
      console.log('[NextAuth] Session callback:', { session, token });
      
      if (token.error === 'TokenExpired') {
        // Return an empty session to trigger a new sign in
        return {
          ...session,
          error: 'TokenExpired'
        };
      }
      
      if (session.user && token) {
        session.user.id = token.userId as string;
        session.accessToken = token.accessToken as string;
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('[NextAuth] Redirect callback:', { url, baseUrl });
      // Allow ngrok URLs in development
      if (process.env.NODE_ENV === 'development' && (url.startsWith('http://localhost:') || url.includes('ngrok-free.app'))) {
        return url;
      }
      // Always allow redirects to the same origin
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: true,
  logger: {
    error(code, ...message) {
      console.error('[NextAuth][Error]', code, message);
    },
    warn(code, ...message) {
      console.warn('[NextAuth][Warn]', code, message);
    },
    debug(code, ...message) {
      console.debug('[NextAuth][Debug]', code, message);
    }
  }
};

export default NextAuth(authOptions);
