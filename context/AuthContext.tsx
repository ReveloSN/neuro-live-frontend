"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { UserRole } from "@/lib/types";

const SESSION_KEY_TOKEN = "nl_token";
const SESSION_KEY_ROLE = "nl_role";
const SESSION_KEY_NAME = "nl_name";

// Middleware runs on the Edge and cannot read sessionStorage, so we mirror
// nl_token and nl_role into session cookies (no max-age → expire with tab).
function setSessionCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Strict`;
}

function clearSessionCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict`;
}

const VALID_ROLES: UserRole[] = ["USER_PERSONAL", "PATIENT", "CAREGIVER", "DOCTOR"];
function isValidRole(value: string | null): value is UserRole {
  return VALID_ROLES.includes(value as UserRole);
}

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
    try {
      const token = sessionStorage.getItem(SESSION_KEY_TOKEN);
      const role = sessionStorage.getItem(SESSION_KEY_ROLE);
      const name = sessionStorage.getItem(SESSION_KEY_NAME);

      if (token && isValidRole(role) && name) {
        setUser({ token, role, name });
      }
    } catch {
      // sessionStorage unavailable (e.g. private-browsing SecurityError) — start unauthenticated
    } finally {
      setLoading(false);
    }
  }, []);

  function login(token: string, role: UserRole, name: string) {
    try {
      sessionStorage.setItem(SESSION_KEY_TOKEN, token);
      sessionStorage.setItem(SESSION_KEY_ROLE, role);
      sessionStorage.setItem(SESSION_KEY_NAME, name);
      setSessionCookie(SESSION_KEY_TOKEN, token);
      setSessionCookie(SESSION_KEY_ROLE, role);
    } catch {
      // sessionStorage unavailable — session will not survive a refresh
    }
    setUser({ token, role, name });
  }

  function logout() {
    try {
      sessionStorage.removeItem(SESSION_KEY_TOKEN);
      sessionStorage.removeItem(SESSION_KEY_ROLE);
      sessionStorage.removeItem(SESSION_KEY_NAME);
      clearSessionCookie(SESSION_KEY_TOKEN);
      clearSessionCookie(SESSION_KEY_ROLE);
    } catch {
      // ignore
    }
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
