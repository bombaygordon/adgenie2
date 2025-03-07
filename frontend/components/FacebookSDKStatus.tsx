import { useState, useEffect } from 'react';

interface FacebookSDKStatusProps {
  // Only show in development mode (process.env.NODE_ENV === 'development')
  devOnly?: boolean;
}

interface FacebookLoginStatus {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    expiresIn: string;
    signedRequest: string;
    userID: string;
  };
}

// Simplified SDK interface with only what we need
interface FacebookSDK {
  getLoginStatus(callback: (response: FacebookLoginStatus) => void): void;
}

// Extend Window interface in the global scope
declare global {
  interface Window {
    FB?: any; // Use any type to avoid conflicts
  }
}

export default function FacebookSDKStatus({ devOnly = true }: FacebookSDKStatusProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sdkVersion, setSdkVersion] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkSDKStatus = async () => {
    try {
      if (!window.FB) {
        return;
      }
      
      // Check if SDK is really initialized by making a safe API call
      window.FB.getLoginStatus((response: FacebookLoginStatus) => {
        setSdkVersion(window.FB?.version || 'unknown');
        setStatus('ready');
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  useEffect(() => {
    // Only run in development unless devOnly is false
    if (devOnly && process.env.NODE_ENV !== 'development') {
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.FB) {
        checkSDKStatus();
        clearInterval(checkInterval);
      }
    }, 500);

    // Timeout after 15 seconds
    const timeout = setTimeout(() => {
      if (status === 'loading') {
        setErrorMessage('Timeout while waiting for SDK to initialize');
        setStatus('error');
        clearInterval(checkInterval);
      }
    }, 15000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [devOnly, status]);

  // If in production and devOnly is true, don't render anything
  if (devOnly && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 p-3 rounded-lg shadow-lg bg-surface border border-gray-700 text-sm">
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            status === 'ready'
              ? 'bg-green-500'
              : status === 'error'
              ? 'bg-red-500'
              : 'bg-yellow-500 animate-pulse'
          }`}
        />
        <span className="font-medium text-white">FB SDK:</span>
        <span>
          {status === 'ready'
            ? `Ready (v${sdkVersion})`
            : status === 'error'
            ? 'Error'
            : 'Loading...'}
        </span>
      </div>
      {errorMessage && <p className="mt-1 text-red-400 text-xs">{errorMessage}</p>}
      {status === 'ready' && (
        <button 
          onClick={() => {
            console.log('FB SDK Object:', window.FB);
          }}
          className="mt-2 text-xs text-blue-400 hover:underline"
        >
          Log SDK to Console
        </button>
      )}
    </div>
  );
} 