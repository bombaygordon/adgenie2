// State tracking for the SDK
let isSDKLoaded = false;
let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

// Enable debug logging
const DEBUG = true;
function log(...args: any[]) {
  if (DEBUG) {
    console.log('[FB SDK Helper]', ...args);
  }
}

interface FacebookAuthResponse {
  accessToken: string;
  expiresIn: string;
  signedRequest: string;
  userID: string;
}

interface FacebookLoginResponse {
  authResponse: FacebookAuthResponse | null;
  status: 'connected' | 'not_authorized' | 'unknown';
}

/**
 * Loads Facebook SDK script if not already loaded and initializes it
 * @param appId - The Facebook App ID
 * @returns Promise that resolves when SDK is ready
 */
export function initializeFacebookSDK(appId: string): Promise<boolean> {
  // If we're already initializing, return the existing promise
  if (initPromise) {
    return initPromise;
  }

  // Create a new initialization promise
  log('Starting Facebook SDK initialization');
  initPromise = new Promise((resolve, reject) => {
    // Define the async init function that Facebook will call
    window.fbAsyncInit = function() {
      log('fbAsyncInit called, initializing SDK with appId:', appId);
      
      try {
        if (!window.FB) {
          const errorMsg = 'window.FB is undefined in fbAsyncInit';
          log(errorMsg);
          reject(new Error(errorMsg));
          return;
        }
        
        window.FB.init({
          appId,
          version: 'v19.0',
          cookie: true,
          xfbml: true,
          status: true
        });
        
        // Add a short delay to ensure internal Facebook initialization is complete
        setTimeout(() => {
          isInitialized = true;
          log('Facebook SDK initialized successfully');
          resolve(true);
        }, 500);
      } catch (err) {
        log('Failed to initialize Facebook SDK:', err);
        reject(err);
      }
    };

    // Only load the script if it's not already loaded
    if (!isSDKLoaded && !document.getElementById('facebook-jssdk')) {
      log('Loading Facebook SDK script');
      isSDKLoaded = true;
      
      // Create a div for FB SDK to use (required by FB SDK)
      if (!document.getElementById('fb-root')) {
        const fbRoot = document.createElement('div');
        fbRoot.id = 'fb-root';
        document.body.appendChild(fbRoot);
      }
      
      // Add the SDK script to the page
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.id = 'facebook-jssdk';
      
      script.onload = () => {
        log('Facebook SDK script loaded successfully');
      };
      
      script.onerror = (error) => {
        const errorMsg = 'Error loading Facebook SDK script';
        log(errorMsg, error);
        reject(new Error(errorMsg));
      };
      
      // Append script to document
      document.head.appendChild(script);
    } else if (!window.FB || window.FB === undefined) {
      // If script is loaded but FB is not defined yet, wait for it
      log('Script tag exists but FB not defined yet, waiting...');
      const checkInterval = setInterval(() => {
        if (window.FB) {
          clearInterval(checkInterval);
          log('FB object found in waiting interval');
          // fbAsyncInit will be called by the SDK
        }
      }, 100);
      
      // Set a timeout just in case
      setTimeout(() => {
        if (!isInitialized) {
          clearInterval(checkInterval);
          reject(new Error('Facebook SDK initialization timed out'));
        }
      }, 15000);
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
export async function performFacebookLogin(scope: string = 'ads_management,ads_read,business_management'): Promise<any> {
  try {
    // Make absolutely sure the SDK is ready before proceeding
    await ensureSDKIsReady();
    
    log('SDK ready, performing login with scope:', scope);
    
    return new Promise((resolve, reject) => {
      window.FB.login((response) => {
        if (response.authResponse) {
          log('Login successful', response.authResponse);
          resolve(response.authResponse);
        } else {
          log('Login failed or was cancelled by user');
          reject(new Error('Facebook login was cancelled or failed'));
        }
      }, {
        scope,
        return_scopes: true,
        enable_profile_selector: true,
        auth_type: 'rerequest'
      });
    });
  } catch (error) {
    log('Error in performFacebookLogin:', error);
    throw error;
  }
}

/**
 * Checks the current Facebook login status
 * @returns Promise with the login status
 */
export async function checkLoginStatus(): Promise<any> {
  try {
    await ensureSDKIsReady();
    
    return new Promise((resolve) => {
      window.FB.getLoginStatus((response) => {
        resolve(response);
      });
    });
  } catch (error) {
    log('Error checking login status:', error);
    return { status: 'unknown', error };
  }
} 