import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface User {
  id: string;
  email: string;
  isPremium: boolean;
  brainDumpCount: number;
  resetCount: number;
  canUseBrainDump?: boolean;
  canUseReset?: boolean;
  remainingBrainDumps?: number;
  remainingResets?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "@invisible_load_reducer:auth_token";
const ONBOARDING_KEY = "@invisible_load_reducer:has_seen_onboarding";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboardingState] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedOnboarding] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);

      setHasSeenOnboardingState(storedOnboarding === "true");

      if (storedToken) {
        setToken(storedToken);
        await fetchUser(storedToken);
      }
    } catch (error) {
      console.error("Failed to load auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUser = async (authToken: string) => {
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/me", baseUrl);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await response.json();

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/signup", { email, password });
    const data = await response.json();

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      if (token) {
        const baseUrl = getApiUrl();
        const url = new URL("/api/auth/logout", baseUrl);
        await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    }

    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUser(token);
    }
  };

  const setHasSeenOnboarding = async (seen: boolean) => {
    await AsyncStorage.setItem(ONBOARDING_KEY, seen ? "true" : "false");
    setHasSeenOnboardingState(seen);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
        hasSeenOnboarding,
        setHasSeenOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
