import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { performFacebookLogin } from '@/lib/facebook-sdk';
import { useAuth } from '@/context/AuthContext';

export default function SignIn() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { callbackUrl, error } = router.query;
  const { setMetaAuth } = useAuth();

  useEffect(() => {
    console.log('[SignIn] Session status:', status);
    console.log('[SignIn] Session data:', session);
    console.log('[SignIn] Callback URL:', callbackUrl);
    console.log('[SignIn] Error:', error);

    if (status === 'authenticated' && callbackUrl) {
      console.log('[SignIn] User is authenticated, redirecting to:', callbackUrl);
      router.push(callbackUrl as string);
    }
  }, [status, session, router, callbackUrl]);

  const handleSignIn = async () => {
    try {
      console.log('[SignIn] Initiating Facebook sign in with callback:', callbackUrl);
      
      // First, perform Facebook SDK login
      const authResponse = await performFacebookLogin('email,ads_management,ads_read,business_management,public_profile');
      console.log('[SignIn] Facebook login successful:', authResponse);

      // Store the token in auth context
      setMetaAuth(authResponse.accessToken);

      // Then, create NextAuth session
      console.log('[SignIn] Creating NextAuth session with token:', authResponse.accessToken);
      const result = await signIn('facebook', { 
        access_token: authResponse.accessToken,
        callbackUrl: callbackUrl as string || '/dashboard/top-ads',
        redirect: false
      });

      console.log('[SignIn] NextAuth sign in result:', result);

      if (result?.error) {
        throw new Error(result.error);
      }

      // Wait a moment for the session to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if we have a valid session
      const currentSession = await fetch('/api/auth/session');
      const sessionData = await currentSession.json();
      console.log('[SignIn] Current session:', sessionData);

      if (sessionData?.accessToken) {
        router.push(callbackUrl as string || '/dashboard/top-ads');
      } else {
        throw new Error('Failed to create session');
      }
    } catch (err) {
      console.error('[SignIn] Sign in error:', err);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          {error && (
            <div className="mt-4 text-center text-sm text-red-500">
              {error === 'OAuthSignin' ? 'An error occurred during sign in. Please try again.' : error}
            </div>
          )}
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={handleSignIn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue with Facebook
          </button>
        </div>
      </div>
    </div>
  );
} 