import type { FacebookAuthResponse, FacebookLoginStatusResponse } from '@/types/facebook';

// State tracking for the SDK
let isSDKLoaded = false;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Enable debug logging
const DEBUG = true;
const log = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log('[FB SDK Helper]', message, ...args);
  }
};

export interface FacebookLoginResponse {
  authResponse: FacebookAuthResponse | null;
  status: 'connected' | 'not_authorized' | 'unknown';
}

// Custom error types for better error handling
export class FacebookSDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FacebookSDKError';
  }
}

export class FacebookInitError extends FacebookSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'FacebookInitError';
  }
}

export class FacebookLoginError extends FacebookSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'FacebookLoginError';
  }
}

/**
 * Loads Facebook SDK script if not already loaded and initializes it
 * @param appId - The Facebook App ID
 * @returns Promise that resolves when SDK is ready
 */
export async function initializeFacebookSDK(appId: string): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    if (isInitialized) {
      resolve();
      return;
    }

    log('Starting Facebook SDK initialization');

    // Load the SDK if not already loaded
    if (!isSDKLoaded) {
      log('Loading Facebook SDK script');
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        log('Facebook SDK script loaded successfully');
        isSDKLoaded = true;
        initializeSDK();
      };

      script.onerror = () => {
        const error = new Error('Failed to load Facebook SDK script');
        log('Error:', error);
        reject(error);
      };

      document.body.appendChild(script);
    } else {
      initializeSDK();
    }

    function initializeSDK() {
      if (!window.FB) {
        reject(new Error('Facebook SDK not available'));
        return;
      }

      log(`fbAsyncInit called, initializing SDK with appId: ${appId}`);
      
      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: 'v18.0'
      });

      isInitialized = true;
      log('Facebook SDK initialized successfully');
      resolve();
    }
  });

  return initPromise;
}

/**
 * Ensures the Facebook SDK is ready to use
 * This function will check the SDK state and wait if needed
 */
export async function ensureSDKIsReady(): Promise<void> {
  if (isInitialized && window.FB) {
    return;
  }
  
  if (!initPromise) {
    throw new Error('Facebook SDK initialization not started');
  }
  
  try {
    await initPromise;
    
    // Double check FB is available after init
    if (!window.FB) {
      throw new Error('Facebook SDK still not available after initialization');
    }
    
    // Add an extra safety check with FB.getLoginStatus 
    // This ensures the SDK is really ready internally
    await new Promise<void>((resolve, reject) => {
      try {
        window.FB.getLoginStatus(() => {
          log('FB.getLoginStatus completed successfully, SDK is fully ready');
          resolve();
        });
        
        // Set timeout for getLoginStatus call
        setTimeout(() => {
          reject(new Error('FB.getLoginStatus call timed out'));
        }, 5000);
      } catch (err) {
        reject(err);
      }
    });
  } catch (error) {
    throw new Error(`SDK not ready: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

/**
 * Performs Facebook login with the requested permissions
 * @returns Promise with the auth response containing the access token
 */
export async function performFacebookLogin(scope: string): Promise<FacebookAuthResponse> {
  if (!isInitialized) {
    throw new Error('Facebook SDK not initialized');
  }

  log(`SDK ready, performing login with scope: ${scope}`);

  return new Promise((resolve, reject) => {
    window.FB.login((response: FacebookLoginStatusResponse) => {
      if (response.status === 'connected' && response.authResponse) {
        log('Login successful', response.authResponse);
        resolve(response.authResponse);
      } else {
        const error = new Error('Facebook login failed or was cancelled');
        log('Login failed:', error);
        reject(error);
      }
    }, {
      scope,
      return_scopes: true,
      enable_profile_selector: true,
      auth_type: 'rerequest'
    });
  });
}

/**
 * Checks the current Facebook login status
 * @returns Promise with the login status
 */
export async function checkLoginStatus(): Promise<FacebookAuthResponse | null> {
  if (!isInitialized) {
    throw new Error('Facebook SDK not initialized');
  }

  return new Promise((resolve) => {
    window.FB.getLoginStatus((response: FacebookLoginStatusResponse) => {
      if (response.status === 'connected' && response.authResponse) {
        resolve(response.authResponse);
      } else {
        resolve(null);
      }
    });
  });
}

export async function makeGraphRequest(path: string, params: any = {}, accessToken: string): Promise<any> {
  if (!isInitialized) {
    throw new Error('Facebook SDK not initialized');
  }

  return new Promise((resolve, reject) => {
    window.FB.api(path, { access_token: accessToken, ...params }, (response: any) => {
      if (!response || response.error) {
        reject(response?.error || new Error('Failed to make Graph API request'));
        return;
      }
      resolve(response);
    });
  });
}

// Add type for the FB SDK
declare global {
  interface Window {
    FB: typeof FB;
    fbAsyncInit: () => void;
  }
} 