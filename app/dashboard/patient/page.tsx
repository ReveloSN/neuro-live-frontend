"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CalmMode from "@/components/CalmMode";
import WorkspaceEditor from "@/components/WorkspaceEditor";
import HistorialView from "@/components/HistorialView";
import ConfiguracionView from "@/components/ConfiguracionView";

// ---------------------------------------------------------------------------
// PLACEHOLDER DATA — replace with real API calls when backend is ready
// ---------------------------------------------------------------------------
const PLACEHOLDER_BPM = 74; // PLACEHOLDER: real-time BPM from wearable sensor
const PLACEHOLDER_SPO2 = 98; // PLACEHOLDER: real-time SpO2 from wearable sensor
const PLACEHOLDER_BPM_SERIES = [72, 75, 71, 74, 78, 76, 73, 77, 80, 78, 75, 72, 74, 76, 73, 71, 74, 77, 75, 73]; // PLACEHOLDER: streaming BPM data
const PLACEHOLDER_SPO2_SERIES = [98, 97, 98, 99, 98, 97, 98, 98, 97, 98, 99, 98, 97, 98, 98, 99, 98, 97, 98, 98]; // PLACEHOLDER: streaming SpO2 data
const PLACEHOLDER_SESSION_GOAL_MIN = 45; // PLACEHOLDER: session goal minutes from user settings
const PLACEHOLDER_ZEN_TIP = "Respira profundo. Estás en un espacio seguro. Cada palabra que escribes es un paso valioso hacia tu bienestar."; // PLACEHOLDER: rotating zen tips from API
const PLACEHOLDER_STATUS: PatientStatus = "Normal"; // PLACEHOLDER: real-time status from biometric analysis API
const PLACEHOLDER_CAREGIVER_NAME = "María López"; // PLACEHOLDER: linked caregiver name from user profile API
// ---------------------------------------------------------------------------

type Tab = "Escritorio" | "Historial" | "Configuración";
type PatientStatus = "Normal" | "Riesgo" | "Crisis";

const STATUS_CONFIG: Record<PatientStatus, { bg: string; color: string; dot: string }> = {
  Normal: { bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  Riesgo: { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  Crisis: { bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function MiniChart({ bpmData, spo2Data }: { bpmData: number[]; spo2Data: number[] }) {
  const W = 300;
  const H = 50;
  const PAD = { top: 6, right: 6, bottom: 6, left: 6 };

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

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H }}
      aria-label="Gráfico de métricas en tiempo real"
    >
      <path d={bpmPath} fill="none" stroke="#4A7FA5" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <path d={spo2Path} fill="none" stroke="#34D399" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
      <div className="h-2 rounded-full transition-all" style={{ backgroundColor: color, width: `${value}%` }} />
    </div>
  );
}

function getBarColor(pct: number): string {
  if (pct <= 40) return "#4ADE80";
  if (pct <= 70) return "#F59E0B";
  return "#EF4444";
}

function getBarLabel(pct: number): string {
  if (pct <= 40) return "Normal";
  if (pct <= 70) return "Atención";
  return "Alerta";
}

export default function PatientDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Escritorio");
  const [sessionSeconds, setSessionSeconds] = useState(0); // PLACEHOLDER: session seconds synced with API
  const [calmModeActive, setCalmModeActive] = useState(false);
  const [historialKey, setHistorialKey] = useState(0);
  const [patientId, setPatientId] = useState<number | undefined>(undefined);
  const [dwellTimePct, setDwellTimePct] = useState(0);
  const [flightTimePct, setFlightTimePct] = useState(0);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const id = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("https://neurolive-backend.azurewebsites.net/users/me", {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { id?: number } | null) => { if (data?.id) setPatientId(data.id); })
      .catch(() => {});
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-4"
          style={{ borderColor: "#4A7FA5", borderTopColor: "transparent" }}
          aria-label="Cargando"
        />
      </div>
    );
  }

  const sessionGoalSeconds = PLACEHOLDER_SESSION_GOAL_MIN * 60;
  const sessionProgressPct = Math.min(100, (sessionSeconds / sessionGoalSeconds) * 100);
  const tabs: Tab[] = ["Escritorio", "Historial", "Configuración"];

  // PLACEHOLDER: status derived from real-time biometric analysis
  const status = PLACEHOLDER_STATUS;
  const statusCfg = STATUS_CONFIG[status];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8" }}>
      {calmModeActive && (
        <CalmMode
          onExit={() => setCalmModeActive(false)}
          onSAMComplete={(valence, arousal, dominance) => {
            // TODO: POST /crises/{crisisId}/sam with { valence, arousal, dominance }
            console.log("[SAM] valence:", valence, "arousal:", arousal, "dominance:", dominance);
            setHistorialKey((k) => k + 1);
          }}
          userToken={user.token}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-3 shadow-sm"
        style={{ backgroundColor: "#ffffff" }}
      >
        <span className="shrink-0 text-xl font-bold tracking-tight" style={{ color: "#4A7FA5" }}>
          NeuroLive
        </span>

        <nav className="flex items-center gap-1" aria-label="Navegación principal">
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
          <div className="mx-1 h-5 w-px flex-shrink-0" style={{ backgroundColor: "#E5E7EB" }} />
          <button
            onClick={() => router.push("/dashboard/linking")}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
            style={{ backgroundColor: "transparent", color: "#6B7280" }}
          >
            Vinculación
          </button>
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

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 max-w-screen-xl mx-auto w-full">

        {activeTab === "Historial" && (
          <div className="mx-auto max-w-3xl">
            <HistorialView role="PATIENT" userToken={user.token} refreshKey={historialKey} />
          </div>
        )}

        {activeTab === "Configuración" && (
          <ConfiguracionView role="PATIENT" user={user} token={user.token} />
        )}

        {/* ── Escritorio split layout ───────────────────────────────────────── */}
        {activeTab === "Escritorio" && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ── Left: Text Editor ────────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-3">

          <WorkspaceEditor
            userId={patientId}
            userToken={user.token}
            onMetricsUpdate={(dwell, flight) => {
              setDwellTimePct(dwell);
              setFlightTimePct(flight);
            }}
          />

          {/* Calm assistant message */}
          <div
            className="flex items-start gap-3 rounded-2xl px-4 py-4"
            style={{ backgroundColor: "#D6E8F5" }}
          >
            <div
              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: "#4A7FA5" }}
              aria-hidden="true"
            >
              <FaceSmileIcon />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1e3a4f" }}>
                Asistente NeuroLive
              </p>
              {/* PLACEHOLDER: dynamic assistant messages from API */}
              <p className="mt-0.5 text-sm leading-relaxed" style={{ color: "#2d5a7a" }}>
                Todo va bien. Estás en un espacio seguro. Tómate el tiempo que necesites y escribe a tu propio ritmo.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Metrics Panel ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-3">

          {/* Status badge — PLACEHOLDER: real-time status from biometric analysis */}
          <div className="flex justify-end">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusCfg.dot }} />
              {status}
            </span>
          </div>

          {/* Real-time metrics card */}
          <div
            className="rounded-2xl p-3"
            style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
          >
            <h2 className="text-sm font-semibold text-gray-700">Métricas en tiempo real</h2>

            <div className="mt-3 flex items-end gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">BPM</p>
                {/* PLACEHOLDER: real-time BPM from wearable */}
                <p className="text-xl font-bold" style={{ color: "#4A7FA5" }}>
                  {PLACEHOLDER_BPM}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">SpO2</p>
                {/* PLACEHOLDER: real-time SpO2 from wearable */}
                <p className="text-xl font-bold" style={{ color: "#34D399" }}>
                  {PLACEHOLDER_SPO2}<span className="text-sm font-normal">%</span>
                </p>
              </div>
            </div>

            <div className="mt-3" style={{ borderTop: "1px solid #F9FAFB", paddingTop: "12px" }}>
              {/* PLACEHOLDER: streaming BPM/SpO2 chart data */}
              <MiniChart bpmData={PLACEHOLDER_BPM_SERIES} spo2Data={PLACEHOLDER_SPO2_SERIES} />
              <div className="mt-2 flex gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-4 rounded-full" style={{ backgroundColor: "#4A7FA5" }} />
                  BPM
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-4 rounded-full" style={{ backgroundColor: "#34D399" }} />
                  SpO2
                </span>
              </div>
            </div>
          </div>

          {/* Active session card */}
          <div
            className="rounded-2xl p-3"
            style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
          >
            <h2 className="text-sm font-semibold text-gray-700">Sesión activa</h2>
            {/* PLACEHOLDER: session timer synced with API */}
            <p className="mt-2 text-xl font-bold tabular-nums" style={{ color: "#4A7FA5" }}>
              {formatDuration(sessionSeconds)}
            </p>
            {/* PLACEHOLDER: session goal from user settings */}
            <p className="mt-0.5 text-xs text-gray-400">Meta: {PLACEHOLDER_SESSION_GOAL_MIN} min</p>

            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-gray-400">Progreso</span>
                <span className="font-semibold" style={{ color: "#4A7FA5" }}>
                  {Math.round(sessionProgressPct)}%
                </span>
              </div>
              <ProgressBar value={sessionProgressPct} color="#4A7FA5" />
            </div>
          </div>

          {/* Writing dynamics card */}
          <div
            className="rounded-2xl p-3"
            style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
          >
            <h2 className="text-sm font-semibold text-gray-700">Dinámicas de escritura</h2>

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Dwell Time</span>
                  <span className="font-semibold" style={{ color: getBarColor(dwellTimePct) }}>
                    {Math.round(dwellTimePct)}%
                  </span>
                </div>
                <ProgressBar value={dwellTimePct} color={getBarColor(dwellTimePct)} />
                <span className="mt-1 block text-xs font-medium" style={{ color: getBarColor(dwellTimePct) }}>
                  {getBarLabel(dwellTimePct)}
                </span>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Flight Time</span>
                  <span className="font-semibold" style={{ color: getBarColor(flightTimePct) }}>
                    {Math.round(flightTimePct)}%
                  </span>
                </div>
                <ProgressBar value={flightTimePct} color={getBarColor(flightTimePct)} />
                <span className="mt-1 block text-xs font-medium" style={{ color: getBarColor(flightTimePct) }}>
                  {getBarLabel(flightTimePct)}
                </span>
              </div>
            </div>
          </div>

          {/* Activar Modo Calma */}
          <button
            onClick={() => setCalmModeActive(true)}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ background: "linear-gradient(135deg, #4A7FA5, #2d5a7a)", border: "2px solid #D6E8F5", boxShadow: "0 4px 15px rgba(74,127,165,0.5)", letterSpacing: "0.05em" }}
          >
            🌿 Activar Modo Calma
          </button>

          {/* Zen tip card */}
          <div
            className="rounded-2xl p-3"
            style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SparkleIcon />
              <h2 className="text-sm font-semibold text-gray-700">Consejo Zen</h2>
            </div>
            {/* PLACEHOLDER: rotating zen tips from API */}
            <p className="text-sm leading-relaxed text-gray-500">{PLACEHOLDER_ZEN_TIP}</p>
          </div>

          {/* Monitoring notice — PLACEHOLDER: linked caregiver/doctor from user profile API */}
          <p className="text-center text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
            <ShieldIcon />
            {" "}Tus datos biométricos son monitoreados en tiempo real por tu cuidador vinculado
            {/* PLACEHOLDER: linked caregiver/doctor name from profile API */}
            {" "}({PLACEHOLDER_CAREGIVER_NAME}).
          </p>
        </div>
        </div>
        )}
      </main>
    </div>
  );
}

// ── Small helper components ──────────────────────────────────────────────────

function FaceSmileIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="white" strokeWidth={1.5} aria-hidden="true">
      <circle cx="10" cy="10" r="8" />
      <path d="M7 11.5c.8 1.2 2 1.8 3 1.8s2.2-.6 3-1.8" strokeLinecap="round" />
      <circle cx="7.5" cy="8.5" r="0.75" fill="white" stroke="none" />
      <circle cx="12.5" cy="8.5" r="0.75" fill="white" stroke="none" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="#4A7FA5" strokeWidth={1.4} aria-hidden="true">
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" strokeLinecap="round" />
      <path d="M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M11.2 4.8l1.4-1.4M3.4 12.6l1.4-1.4" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 16 16" className="inline h-3 w-3 mb-0.5" fill="none" stroke="#9CA3AF" strokeWidth={1.4} aria-hidden="true">
      <path d="M8 1.5L2.5 4v4c0 3 2.5 5.5 5.5 6 3-0.5 5.5-3 5.5-6V4L8 1.5z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
