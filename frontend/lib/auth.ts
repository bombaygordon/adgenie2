import { FacebookAuthResponse } from './facebook-sdk';

const TOKEN_KEY = 'meta_access_token';
const TOKEN_EXPIRY_KEY = 'meta_token_expiry';

export function storeAccessToken(authResponse: FacebookAuthResponse): void {
  if (!authResponse.accessToken || !authResponse.expiresIn) {
    throw new Error('Invalid auth response: missing token or expiry');
  }

  // Store the access token
  localStorage.setItem(TOKEN_KEY, authResponse.accessToken);
  
  // Calculate and store expiry time
  const expiryTime = Date.now() + parseInt(authResponse.expiresIn) * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

export function getStoredAccessToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) {
    return null;
  }

  // Check if token has expired
  if (Date.now() > parseInt(expiry)) {
    clearStoredAccessToken();
    return null;
  }

  return token;
}

export function clearStoredAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function isAuthenticated(): boolean {
  return getStoredAccessToken() !== null;
} 