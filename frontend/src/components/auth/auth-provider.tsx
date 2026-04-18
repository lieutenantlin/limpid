"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getCurrentUser, login as loginRequest } from "@/lib/api";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth";
import type { User } from "@/lib/types";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: getCurrentUser,
    enabled: Boolean(token),
    retry: false,
  });

  const sessionToken = userQuery.isError ? null : token;

  const value = useMemo<AuthContextValue>(
    () => ({
      token: sessionToken,
      user: userQuery.data ?? null,
      isLoading: sessionToken === null ? false : userQuery.isLoading,
      async login(email, password) {
        const result = await loginRequest(email, password);
        setStoredToken(result.token);
        setToken(result.token);
        queryClient.setQueryData(["auth", "me", result.token], result.user);
      },
      logout() {
        clearStoredToken();
        setToken(null);
        queryClient.removeQueries({ queryKey: ["auth"] });
      },
    }),
    [queryClient, sessionToken, userQuery.data, userQuery.isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
