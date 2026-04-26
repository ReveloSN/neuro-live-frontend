"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ---------------------------------------------------------------------------
// PLACEHOLDER DATA — replace with real API calls when backend is ready
// ---------------------------------------------------------------------------
const PLACEHOLDER_BPM_DATA = [72, 75, 71, 74, 78, 76, 73, 77, 80, 78, 75, 72, 74, 76, 73, 71, 74, 77, 75, 73];
const PLACEHOLDER_SPO2_DATA = [98, 97, 98, 99, 98, 97, 98, 98, 97, 98, 99, 98, 97, 98, 98, 99, 98, 97, 98, 98];

const PLACEHOLDER_SESSIONS = [
  { fecha: "24 abr 2026", duracion: "32:14", estado: "Normal",  intervenciones: 0 },
  { fecha: "22 abr 2026", duracion: "28:45", estado: "Riesgo",  intervenciones: 1 },
  { fecha: "20 abr 2026", duracion: "41:02", estado: "Crisis",  intervenciones: 2 },
];

const PLACEHOLDER_METRICS = {
  bpm: 74,
  spo2: 98,
  activeTime: "24:37",
};

const PLACEHOLDER_WRITING = {
  dwellTime: 68,
  flightTime: 45,
};
// ---------------------------------------------------------------------------

type Tab = "Panel" | "Historial" | "Configuración";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Normal: { bg: "#D1FAE5", color: "#065F46" },
  Riesgo: { bg: "#FEF3C7", color: "#92400E" },
  Crisis: { bg: "#FEE2E2", color: "#991B1B" },
};

function StatusBadge({ estado }: { estado: string }) {
  const s = STATUS_STYLES[estado] ?? { bg: "#F3F4F6", color: "#374151" };
  return (
    <span
      className="inline-block rounded-full px-3 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {estado}
    </span>
  );
}

function RealtimeChart({
  bpmData,
  spo2Data,
}: {
  bpmData: number[];
  spo2Data: number[];
}) {
  const W = 560;
  const H = 150;
  const PAD = { top: 12, right: 16, bottom: 20, left: 38 };

  const all = [...bpmData, ...spo2Data];
  const min = Math.min(...all) - 4;
  const max = Math.max(...all) + 4;

  const toX = (i: number, len: number) =>
    PAD.left + (i / (len - 1)) * (W - PAD.left - PAD.right);
  const toY = (v: number) =>
    PAD.top + (1 - (v - min) / (max - min)) * (H - PAD.top - PAD.bottom);

  const bpmPath = bpmData
    .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i, bpmData.length).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(" ");
  const spo2Path = spo2Data
    .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i, spo2Data.length).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(" ");

  const yTicks = [min + 4, Math.round((min + max) / 2), max - 4];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H }}
      aria-label="Gráfico de monitoreo en tiempo real"
    >
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={toY(tick)}
            y2={toY(tick)}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
          <text
            x={PAD.left - 6}
            y={toY(tick) + 4}
            textAnchor="end"
            fontSize={9}
            fill="#9CA3AF"
          >
            {tick}
          </text>
        </g>
      ))}
      <path d={bpmPath} fill="none" stroke="#4A7FA5" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <path d={spo2Path} fill="none" stroke="#34D399" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function PatientDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Panel");

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
          className="h-8 w-8 animate-spin rounded-full border-4"
          style={{ borderColor: "#4A7FA5", borderTopColor: "transparent" }}
          aria-label="Cargando"
        />
      </div>
    );
  }

  const tabs: Tab[] = ["Panel", "Historial", "Configuración"];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F0E8" }}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-3 shadow-sm"
        style={{ backgroundColor: "#ffffff" }}
      >
        <span className="shrink-0 text-xl font-bold tracking-tight" style={{ color: "#4A7FA5" }}>
          NeuroLive
        </span>

        <nav className="flex gap-1" aria-label="Navegación principal">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
              style={{
                backgroundColor: activeTab === tab ? "#D6E8F5" : "transparent",
                color: activeTab === tab ? "#2d5a7a" : "#6B7280",
              }}
              aria-current={activeTab === tab ? "page" : undefined}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white select-none"
            style={{ backgroundColor: "#4A7FA5" }}
            aria-label={`Avatar de ${user.name}`}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
          >
            Salir
          </button>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Greeting */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {user.name}
          </h1>
          <StatusBadge estado="Normal" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Resumen de tu actividad biométrica hoy
        </p>

        {/* ── Metric cards ─────────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Frecuencia cardíaca
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: "#4A7FA5" }}>
              {PLACEHOLDER_METRICS.bpm}
              <span className="ml-1 text-sm font-normal text-gray-400">BPM</span>
            </p>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Saturación de oxígeno
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: "#4A7FA5" }}>
              {PLACEHOLDER_METRICS.spo2}
              <span className="ml-1 text-sm font-normal text-gray-400">SpO2 %</span>
            </p>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Tiempo activo
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: "#4A7FA5" }}>
              {PLACEHOLDER_METRICS.activeTime}
              <span className="ml-1 text-sm font-normal text-gray-400">MM:SS</span>
            </p>
          </div>
        </div>

        {/* ── Chart + Writing dynamics ──────────────────────────────────── */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Chart — 2 cols */}
          <div
            className="rounded-2xl p-5 lg:col-span-2"
            style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Monitoreo en tiempo real
              </h2>
              <div className="flex gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-5 rounded-full"
                    style={{ backgroundColor: "#4A7FA5" }}
                  />
                  BPM
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-5 rounded-full"
                    style={{ backgroundColor: "#34D399" }}
                  />
                  SpO2
                </span>
              </div>
            </div>
            <div className="mt-3">
              <RealtimeChart
                bpmData={PLACEHOLDER_BPM_DATA}
                spo2Data={PLACEHOLDER_SPO2_DATA}
              />
            </div>
          </div>

          {/* Writing dynamics */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
          >
            <h2 className="text-sm font-semibold text-gray-700">
              Dinámica de escritura
            </h2>

            <div className="mt-6 space-y-6">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Dwell Time</span>
                  <span className="font-semibold" style={{ color: "#4A7FA5" }}>
                    {PLACEHOLDER_WRITING.dwellTime}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: "#4A7FA5",
                      width: `${PLACEHOLDER_WRITING.dwellTime}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Flight Time</span>
                  <span className="font-semibold" style={{ color: "#34D399" }}>
                    {PLACEHOLDER_WRITING.flightTime}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: "#34D399",
                      width: `${PLACEHOLDER_WRITING.flightTime}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent sessions ───────────────────────────────────────────── */}
        <div
          className="mt-4 overflow-hidden rounded-2xl"
          style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #E5E7EB" }}>
            <h2 className="text-sm font-semibold text-gray-700">Sesiones recientes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Fecha
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Duración
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Intervenciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLACEHOLDER_SESSIONS.map((session, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? "1px solid #F9FAFB" : undefined }}>
                    <td className="px-5 py-3.5 text-gray-700">{session.fecha}</td>
                    <td className="px-5 py-3.5 text-gray-700">{session.duracion}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge estado={session.estado} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{session.intervenciones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
