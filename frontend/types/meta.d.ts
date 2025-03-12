export interface FacebookSDK {
  init(params: {
    appId: string;
    version: string;
    cookie?: boolean;
    xfbml?: boolean;
    status?: boolean;
  }): void;
  login(
    callback: (response: {
      authResponse?: {
        accessToken: string;
        expiresIn: string;
        signedRequest: string;
        userID: string;
      };
      status: string;
    }) => void,
    options?: { 
      scope: string;
      return_scopes?: boolean;
      enable_profile_selector?: boolean;
      auth_type?: 'rerequest' | 'reauthorize' | 'reauthenticate';
    }
  ): void;
  api(
    path: string,
    params: any,
    callback: (response: any) => void
  ): void;
  getLoginStatus(callback: (response: {
    status: 'connected' | 'not_authorized' | 'unknown';
    authResponse?: {
      accessToken: string;
      expiresIn: string;
      signedRequest: string;
      userID: string;
    };
  }) => void): void;
}

declare global {
  interface Window {
    FB?: FacebookSDK;
    fbAsyncInit?: () => void;
  }
}

export interface AdAccount {
  id: string;
  name: string;
  status: string;
  currency: string;
  businessName?: string;
}

export interface BusinessManager {
  id: string;
  name: string;
  adAccounts: AdAccount[];
}

export interface ConnectedAccount extends AdAccount {
  platform: 'meta';
  status: 'active' | 'disconnected';
  lastSync?: string;
}

export {}; 