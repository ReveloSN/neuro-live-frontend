"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PatientDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5F0E8" }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
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
          onClick={handleLogout}
          className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ backgroundColor: "#4A7FA5" }}
        >
          Cerrar sesión
        </button>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-6 py-12">
        {/* Role badge */}
        <span
          className="inline-block rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest"
          style={{ backgroundColor: "#D6E8F5", color: "#2d5a7a" }}
        >
          Paciente
        </span>

        {/* Welcome */}
        <h1 className="mt-4 text-3xl font-bold leading-snug text-gray-900">
          Bienvenido, {user.name}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Este es tu panel de seguimiento personal y bienestar.
        </p>

        {/* Placeholder card */}
        <div
          className="mt-10 rounded-2xl p-8 text-center"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
        >
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "#D6E8F5" }}
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#4A7FA5"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-800">Panel en construcción</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Pronto podrás consultar tus señales biométricas, historial de sesiones y
            recursos de apoyo adaptados a tu perfil.
          </p>
        </div>
      </main>
    </div>
  );
}
