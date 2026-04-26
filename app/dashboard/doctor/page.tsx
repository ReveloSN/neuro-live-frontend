"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DoctorDashboardPage() {
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
          Médico
        </span>

        {/* Welcome */}
        <h1 className="mt-4 text-3xl font-bold leading-snug text-gray-900">
          Bienvenido, {user.name}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Aquí podrás hacer seguimiento clínico de tus pacientes y revisar sus registros.
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
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-800">Panel en construcción</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Pronto podrás acceder al historial clínico de tus pacientes, revisar
            métricas biométricas y coordinar intervenciones desde este panel.
          </p>
        </div>
      </main>
    </div>
  );
}
