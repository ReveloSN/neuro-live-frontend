"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { UserRole } from "@/lib/types";

const SESSION_KEY_TOKEN = "nl_token";
const SESSION_KEY_ROLE = "nl_role";
const SESSION_KEY_NAME = "nl_name";

// Middleware runs on the Edge and cannot read sessionStorage. The tab storage
// is the source of truth; cookies only let middleware route the active tab.
function setSessionCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Strict`;
}

function clearSessionCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict`;
}

function readSessionStorage(name: string) {
  try {
    return sessionStorage.getItem(name);
  } catch {
    return null;
  }
}

function writeSessionStorage(name: string, value: string) {
  try {
    sessionStorage.setItem(name, value);
  } catch {
    // sessionStorage unavailable; cookies still keep middleware and client aligned.
  }
}

function removeSessionStorage(name: string) {
  try {
    sessionStorage.removeItem(name);
  } catch {
    // ignore
  }
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

  // Restore only from tab storage. If it is missing, clear stale middleware cookies
  // so protected routes can redirect to /login instead of looping on a loader.
  useEffect(() => {
    const token = readSessionStorage(SESSION_KEY_TOKEN);
    const role = readSessionStorage(SESSION_KEY_ROLE);
    const name = readSessionStorage(SESSION_KEY_NAME);

    if (token && isValidRole(role) && name) {
      setSessionCookie(SESSION_KEY_TOKEN, token);
      setSessionCookie(SESSION_KEY_ROLE, role);
      setSessionCookie(SESSION_KEY_NAME, name);

      setUser({ token, role, name });
    } else {
      clearSessionCookie(SESSION_KEY_TOKEN);
      clearSessionCookie(SESSION_KEY_ROLE);
      clearSessionCookie(SESSION_KEY_NAME);
    }

    setLoading(false);
  }, []);

  function login(token: string, role: UserRole, name: string) {
    writeSessionStorage(SESSION_KEY_TOKEN, token);
    writeSessionStorage(SESSION_KEY_ROLE, role);
    writeSessionStorage(SESSION_KEY_NAME, name);
    setSessionCookie(SESSION_KEY_TOKEN, token);
    setSessionCookie(SESSION_KEY_ROLE, role);
    setSessionCookie(SESSION_KEY_NAME, name);
    setUser({ token, role, name });
  }

  function logout() {
    removeSessionStorage(SESSION_KEY_TOKEN);
    removeSessionStorage(SESSION_KEY_ROLE);
    removeSessionStorage(SESSION_KEY_NAME);
    clearSessionCookie(SESSION_KEY_TOKEN);
    clearSessionCookie(SESSION_KEY_ROLE);
    clearSessionCookie(SESSION_KEY_NAME);
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
