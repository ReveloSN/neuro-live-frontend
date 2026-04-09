"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { UserRole } from "@/lib/types";

const SESSION_KEY_TOKEN = "nl_token";
const SESSION_KEY_ROLE = "nl_role";
const SESSION_KEY_NAME = "nl_name";

type AuthUser = {
  token: string;
  role: UserRole;
  name: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, role: UserRole, name: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from sessionStorage on page refresh
  useEffect(() => {
    const token = sessionStorage.getItem(SESSION_KEY_TOKEN);
    const role = sessionStorage.getItem(SESSION_KEY_ROLE) as UserRole | null;
    const name = sessionStorage.getItem(SESSION_KEY_NAME);

    if (token && role && name) {
      setUser({ token, role, name });
    }

    setLoading(false);
  }, []);

  function login(token: string, role: UserRole, name: string) {
    sessionStorage.setItem(SESSION_KEY_TOKEN, token);
    sessionStorage.setItem(SESSION_KEY_ROLE, role);
    sessionStorage.setItem(SESSION_KEY_NAME, name);
    setUser({ token, role, name });
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY_TOKEN);
    sessionStorage.removeItem(SESSION_KEY_ROLE);
    sessionStorage.removeItem(SESSION_KEY_NAME);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
