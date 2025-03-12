interface FacebookAuthResponse {
  accessToken: string;
  expiresIn: number;
  signedRequest: string;
  userID: string;
  graphDomain?: string;
  data_access_expiration_time?: number;
}

interface FacebookLoginStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse: FacebookAuthResponse | null;
}

interface FacebookLoginOptions {
  scope?: string;
  return_scopes?: boolean;
  enable_profile_selector?: boolean;
  auth_type?: string;
}

type FacebookLoginCallback = (response: FacebookLoginStatusResponse) => void;
type FacebookApiCallback = (response: any) => void;

interface FacebookSDK {
  init(params: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
  }): void;
  login(cb: FacebookLoginCallback, options?: FacebookLoginOptions): void;
  getLoginStatus(cb: FacebookLoginCallback): void;
  api(path: string, params: { [key: string]: any }, callback: FacebookApiCallback): void;
  api(path: string, callback: FacebookApiCallback): void;
}

declare global {
  interface Window {
    FB: FacebookSDK;
    fbAsyncInit: () => void;
  }
}

export type {
  FacebookAuthResponse,
  FacebookLoginStatusResponse,
  FacebookLoginOptions,
  FacebookLoginCallback,
  FacebookApiCallback,
  FacebookSDK
}; 