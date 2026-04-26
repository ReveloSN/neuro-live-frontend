"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CaregiverDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
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
          Cuidador
        </span>

        {/* Welcome */}
        <h1 className="mt-4 text-3xl font-bold leading-snug text-gray-900">
          Bienvenido, {user.name}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Desde aquí podrás acompañar y monitorear a las personas bajo tu cuidado.
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
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-800">Panel en construcción</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Pronto podrás ver el estado de bienestar en tiempo real, recibir alertas
            y acceder a herramientas de apoyo para las personas que cuidas.
          </p>
        </div>
      </main>
    </div>
  );
}
