import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeFacebookSDK, ensureSDKIsReady } from '@/lib/facebook-sdk';

interface AuthContextType {
  isAuthenticated: boolean;
  metaAccessToken: string | null;
  setMetaAuth: (token: string) => void;
  logout: () => void;
  ensureInitialized: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  metaAccessToken: null,
  setMetaAuth: () => {},
  logout: () => {},
  ensureInitialized: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [metaAccessToken, setMetaAccessToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Initialize Facebook SDK on mount
  useEffect(() => {
    const initSDK = async () => {
      try {
        console.log("[AuthContext] Initializing Facebook SDK");
        await initializeFacebookSDK(process.env.NEXT_PUBLIC_META_APP_ID || '');
        setIsInitialized(true);
        console.log("[AuthContext] Facebook SDK initialized successfully");
      } catch (error) {
        console.error("[AuthContext] Failed to initialize Facebook SDK:", error);
      }
    };
    
    initSDK();
  }, []);
  
  // Load from localStorage on initial mount
  useEffect(() => {
    const token = localStorage.getItem('metaAccessToken');
    if (token) {
      console.log("[AuthContext] Found existing token in localStorage");
      setMetaAccessToken(token);
      setIsAuthenticated(true);
      console.log("[AuthContext] Restored auth state from localStorage");
    } else {
      console.log("[AuthContext] No existing token found in localStorage");
      setIsAuthenticated(false);
    }
  }, []);
  
  const ensureInitialized = async () => {
    if (!isInitialized) {
      console.log("[AuthContext] Waiting for SDK initialization...");
      await ensureSDKIsReady();
      console.log("[AuthContext] SDK is now ready");
    }
  };
  
  const setMetaAuth = (token: string) => {
    if (!token) {
      console.error("[AuthContext] Attempted to set empty token");
      return;
    }
    console.log("[AuthContext] Setting new auth token:", token.substring(0, 10) + '...');
    try {
      localStorage.setItem('metaAccessToken', token);
      setMetaAccessToken(token);
      setIsAuthenticated(true);
      console.log("[AuthContext] Successfully set auth token and updated state");
    } catch (error) {
      console.error("[AuthContext] Error setting auth token:", error);
    }
  };
  
  const logout = () => {
    console.log("[AuthContext] Logging out user");
    localStorage.removeItem('metaAccessToken');
    setMetaAccessToken(null);
    setIsAuthenticated(false);
    console.log("[AuthContext] Successfully cleared auth state");
  };
  
  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      metaAccessToken, 
      setMetaAuth, 
      logout,
      ensureInitialized
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 