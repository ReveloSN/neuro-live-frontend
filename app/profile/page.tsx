"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/lib/api";
import type { UserProfileResponse } from "@/lib/types";

const ROLE_DASHBOARD: Record<string, string> = {
  USER_PERSONAL: "/dashboard/personal",
  PATIENT: "/dashboard/patient",
  CAREGIVER: "/dashboard/caregiver",
  DOCTOR: "/dashboard/doctor",
};

export default function ProfilePage() {
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Fetch profile on mount
  useEffect(() => {
    if (!user) return;

    const apiUrl = getApiBaseUrl();

    fetch(`${apiUrl}/users/me`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
        Accept: "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Error al cargar el perfil (${res.status}).`);
        }
        return res.json() as Promise<UserProfileResponse>;
      })
      .then((data) => {
        setProfile(data);
        setFullName(data.name);
      })
      .catch((err: Error) => {
        setFetchError(err.message ?? "No se pudo cargar el perfil.");
      })
      .finally(() => setFetchLoading(false));
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const trimmed = fullName.trim();
    if (!trimmed) {
      setSaveError("El nombre no puede estar vacío.");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const apiUrl = getApiBaseUrl();

    try {
      const res = await fetch(`${apiUrl}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Error al guardar los cambios (${res.status}).`);
      }

      const updated = (await res.json()) as UserProfileResponse;
      setProfile(updated);
      setFullName(updated.name);

      // Sync updated name into auth session
      login(user.token, user.role, updated.name);

      setSaveSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo guardar.";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  const dashboardPath = user ? (ROLE_DASHBOARD[user.role] ?? "/dashboard") : "/dashboard";

  if (authLoading || (!user && !authLoading)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5F0E8" }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-4"
          style={{ borderColor: "#4A7FA5", borderTopColor: "transparent" }}
          aria-label="Cargando"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F0E8" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 shadow-sm"
        style={{ backgroundColor: "#ffffff" }}
      >
        <span className="text-xl font-bold tracking-tight" style={{ color: "#4A7FA5" }}>
          NeuroLive
        </span>
        <button
          onClick={() => router.push(dashboardPath)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ color: "#4A7FA5" }}
          aria-label="Volver al panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al panel
        </button>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-lg px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
        <p className="mt-1 text-sm text-gray-500">
          Revisa y actualiza tu información personal.
        </p>

        {/* Loading state */}
        {fetchLoading && (
          <div className="mt-10 flex justify-center">
            <div
              className="h-8 w-8 animate-spin rounded-full border-4"
              style={{ borderColor: "#4A7FA5", borderTopColor: "transparent" }}
              aria-label="Cargando perfil"
            />
          </div>
        )}

        {/* Fetch error */}
        {!fetchLoading && fetchError && (
          <div
            className="mt-10 rounded-2xl p-6 text-sm"
            style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}
          >
            {fetchError}
          </div>
        )}

        {/* Profile form */}
        {!fetchLoading && profile && (
          <form
            onSubmit={handleSave}
            className="mt-8 rounded-2xl p-8 space-y-6"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
          >
            {/* Full name */}
            <div className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="block text-sm font-semibold text-gray-700"
              >
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setSaveSuccess(false);
                  setSaveError(null);
                }}
                className="w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 transition focus:outline-none focus:ring-2"
                style={{
                  borderColor: "#d1d5db",
                  backgroundColor: "#fafafa",
                }}
                placeholder="Tu nombre completo"
                autoComplete="name"
                required
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                readOnly
                className="w-full rounded-xl border px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                style={{
                  borderColor: "#e5e7eb",
                  backgroundColor: "#f3f4f6",
                }}
              />
              <p className="text-xs text-gray-400">El correo electrónico no se puede modificar.</p>
            </div>

            {/* Feedback messages */}
            {saveSuccess && (
              <p
                className="rounded-xl px-4 py-2.5 text-sm font-medium"
                style={{ backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
              >
                Perfil actualizado correctamente.
              </p>
            )}
            {saveError && (
              <p
                className="rounded-xl px-4 py-2.5 text-sm font-medium"
                style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}
              >
                {saveError}
              </p>
            )}

            {/* Save button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#4A7FA5" }}
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
