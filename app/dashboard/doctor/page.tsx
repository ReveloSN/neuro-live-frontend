"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import HistorialView from "@/components/HistorialView";
import ConfiguracionView from "@/components/ConfiguracionView";
import { useLinkedPatients } from "@/hooks/useLinkedPatients";

interface Patient {
  id: string;
  name: string;
  status: "Normal" | "Riesgo" | "Crisis";
  evolutionDates: string[];
  bpmSeries: number[];
  spo2Series: number[];
}

// PLACEHOLDER: replace with GET /patients/{id}/crisis-events?from=&to=
interface CrisisEvent {
  id: string;
  fecha: string;
  duracion: string;
  tipoIntervencion: string;
  valenciaSAM: number;
  arousalSAM: number;
}

const PLACEHOLDER_CRISIS_EVENTS: CrisisEvent[] = [
  {
    id: "e1",
    fecha: "15/03/2026",
    duracion: "4 min 30 s",
    tipoIntervencion: "Respiración guiada",
    valenciaSAM: 2,
    arousalSAM: 5,
  },
  {
    id: "e2",
    fecha: "20/03/2026",
    duracion: "2 min 15 s",
    tipoIntervencion: "Música ambiental",
    valenciaSAM: 3,
    arousalSAM: 4,
  },
  {
    id: "e3",
    fecha: "27/03/2026",
    duracion: "6 min 10 s",
    tipoIntervencion: "Luz tenue",
    valenciaSAM: 2,
    arousalSAM: 6,
  },
];
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Normal: { bg: "#D1FAE5", color: "#065F46" },
  Riesgo: { bg: "#FEF3C7", color: "#92400E" },
  Crisis: { bg: "#FEE2E2", color: "#991B1B" },
};

type Tab = "Mis Pacientes" | "Historial" | "Configuración";

// ── Biometric evolution chart ────────────────────────────────────────────────

function EvolutionChart({
  dates,
  bpmData,
  spo2Data,
}: {
  dates: string[];
  bpmData: number[];
  spo2Data: number[];
}) {
  const W = 560;
  const H = 168;
  const PAD = { top: 16, right: 20, bottom: 36, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const all = [...bpmData, ...spo2Data];
  const dataMin = Math.min(...all) - 5;
  const dataMax = Math.max(...all) + 5;

  const toX = (i: number) => PAD.left + (i / (dates.length - 1)) * chartW;
  const toY = (v: number) =>
    PAD.top + (1 - (v - dataMin) / (dataMax - dataMin)) * chartH;

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = dataMin + (i / yTicks) * (dataMax - dataMin);
    return { y: toY(val), label: Math.round(val).toString() };
  });

  const bpmPath = bpmData
    .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(" ");
  const spo2Path = spo2Data
    .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H }}
      aria-label="Gráfico de evolución biométrica"
    >
      {/* Gridlines + Y labels */}
      {gridLines.map(({ y, label }) => (
        <g key={label}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#E5E7EB" strokeWidth={1} />
          <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9CA3AF">
            {label}
          </text>
        </g>
      ))}

      {/* X labels */}
      {dates.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="#9CA3AF">
          {d}
        </text>
      ))}

      {/* BPM line + dots */}
      <path d={bpmPath} fill="none" stroke="#4A7FA5" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {bpmData.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r={4} fill="#4A7FA5" />
      ))}

      {/* SPO2 line + dots */}
      <path d={spo2Path} fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {spo2Data.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r={4} fill="#22C55E" />
      ))}
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DoctorDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const { patients: linkedPatients, loading: patientsLoading, error: patientsError } =
    useLinkedPatients(user?.token ?? "", user?.role ?? "");

  const patients: Patient[] = linkedPatients.map((lp) => ({
    id: String(lp.id),
    name: `Paciente ${lp.patientId}`,
    status: "Normal" as const,
    evolutionDates: ["", ""],
    bpmSeries: [0, 0],
    spo2Series: [0, 0],
  }));

  const [activeTab, setActiveTab] = useState<Tab>("Mis Pacientes");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // PLACEHOLDER date range — replace with a real date-range picker
  const DATE_FROM = "01/03/2026";
  const DATE_TO   = "30/03/2026";

  // Read-only thresholds for the selected patient — source of truth is localStorage
  const [patientThresholds, setPatientThresholds] = useState({ bpmMin: 60, bpmMax: 100, spo2Min: 95 });

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab !== "Mis Pacientes") setSelectedPatient(null);
  }

  function handleExportCSV() {
    // PLACEHOLDER: replace with GET /patients/{id}/export?format=csv&from=&to=
    console.log("Exportar CSV — PLACEHOLDER");
  }

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!selectedPatient) return;
    try {
      const raw = localStorage.getItem(`nl_thresholds_${selectedPatient.name}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.bpmMin === "number" && typeof parsed.bpmMax === "number" && typeof parsed.spo2Min === "number") {
          setPatientThresholds(parsed);
          return;
        }
      }
    } catch {
      // ignore malformed entries
    }
    setPatientThresholds({ bpmMin: 60, bpmMax: 100, spo2Min: 95 });
  }, [selectedPatient]);

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

  const tabs: Tab[] = ["Mis Pacientes", "Historial", "Configuración"];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F0E8" }}>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
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
              onClick={() => handleTabChange(tab)}
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

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

        {activeTab === "Mis Pacientes" && (
          <div className="space-y-6">

            {/* Page title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel Clínico</h1>
              <p className="mt-1 text-sm text-gray-500">
                Supervisión integral de métricas y alertas en tiempo real
              </p>
            </div>

            {/* ── Controls row ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-end gap-4">

              {/* Patient selector */}
              <div className="flex-1 min-w-[240px]">
                <p className="mb-2 text-xs font-medium text-gray-500">Paciente</p>
                {patientsLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-2"
                      style={{ borderColor: "#4A7FA5", borderTopColor: "transparent" }}
                      aria-label="Cargando pacientes"
                    />
                    Cargando pacientes…
                  </div>
                )}
                {!patientsLoading && patientsError && (
                  <p className="text-sm text-red-600">{patientsError}</p>
                )}
                {!patientsLoading && !patientsError && patients.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No tienes pacientes vinculados aún.
                  </p>
                )}
                {!patientsLoading && !patientsError && patients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {patients.map((p) => {
                      const s = STATUS_STYLES[p.status];
                      const isSelected = selectedPatient?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPatient(isSelected ? null : p)}
                          aria-pressed={isSelected}
                          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                          style={{
                            backgroundColor: isSelected ? "#D6E8F5" : "#ffffff",
                            border: `1.5px solid ${isSelected ? "#4A7FA5" : "#E5E7EB"}`,
                            color: isSelected ? "#2d5a7a" : "#374151",
                          }}
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: s.color }}
                            aria-hidden="true"
                          />
                          {p.name}
                          <span
                            className="rounded-full px-1.5 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: s.bg, color: s.color }}
                          >
                            {p.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Date range */}
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">Rango de fechas</p>
                {/* PLACEHOLDER date range — replace with a date-range picker */}
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-gray-700"
                  style={{ backgroundColor: "#ffffff", border: "1.5px solid #E5E7EB" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                  </svg>
                  <span className="font-medium">{DATE_FROM} — {DATE_TO}</span>
                </div>
              </div>
            </div>

            {/* ── Patient detail panels ─────────────────────────────────────── */}
            {selectedPatient ? (
              <div className="space-y-5">

                {/* Biometric evolution chart */}
                <section
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
                  aria-labelledby="evolution-heading"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 id="evolution-heading" className="text-sm font-semibold text-gray-700">
                      Evolución biométrica
                    </h2>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-4 rounded-full" style={{ backgroundColor: "#4A7FA5" }} />
                        BPM promedio
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-4 rounded-full" style={{ backgroundColor: "#22C55E" }} />
                        SPO2 promedio
                      </span>
                    </div>
                  </div>
                  {/* PLACEHOLDER chart data — replace with GET /patients/{id}/biometric-evolution?from=&to= */}
                  <EvolutionChart
                    dates={selectedPatient.evolutionDates}
                    bpmData={selectedPatient.bpmSeries}
                    spo2Data={selectedPatient.spo2Series}
                  />
                </section>

                {/* Activation thresholds — read-only, configured in Configuración tab */}
                <section
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
                  aria-labelledby="thresholds-heading"
                >
                  <h2 id="thresholds-heading" className="text-sm font-semibold text-gray-700 mb-4">
                    Umbrales de activación
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <div
                      className="rounded-xl px-4 py-3 min-w-[100px]"
                      style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
                    >
                      <p className="text-xs font-medium text-gray-400 mb-0.5">BPM Mínimo</p>
                      <p className="text-xl font-bold" style={{ color: "#4A7FA5" }}>
                        {patientThresholds.bpmMin}
                      </p>
                    </div>
                    <div
                      className="rounded-xl px-4 py-3 min-w-[100px]"
                      style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
                    >
                      <p className="text-xs font-medium text-gray-400 mb-0.5">BPM Máximo</p>
                      <p className="text-xl font-bold" style={{ color: "#4A7FA5" }}>
                        {patientThresholds.bpmMax}
                      </p>
                    </div>
                    <div
                      className="rounded-xl px-4 py-3 min-w-[100px]"
                      style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
                    >
                      <p className="text-xs font-medium text-gray-400 mb-0.5">SpO2 Mínimo</p>
                      <p className="text-xl font-bold" style={{ color: "#4A7FA5" }}>
                        {patientThresholds.spo2Min}
                        <span className="ml-0.5 text-sm font-normal text-gray-400">%</span>
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    Los umbrales se configuran en la pestaña Configuración
                  </p>
                </section>

                {/* Crisis events history table */}
                <section
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
                  aria-labelledby="crisis-heading"
                >
                  <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: "1px solid #E5E7EB" }}
                  >
                    <h2 id="crisis-heading" className="text-sm font-semibold text-gray-700">
                      Historial de eventos de crisis
                    </h2>
                    {/* PLACEHOLDER count — replace with events.length from API */}
                    <span className="text-xs text-gray-400">
                      {PLACEHOLDER_CRISIS_EVENTS.length} eventos
                    </span>
                  </div>

                  {/* PLACEHOLDER rows — replace with GET /patients/{id}/crisis-events?from=&to= */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                          {["Fecha", "Duración", "Tipo Intervención", "Valencia SAM", "Arousal SAM", "Acciones"].map(
                            (col) => (
                              <th
                                key={col}
                                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                              >
                                {col}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {PLACEHOLDER_CRISIS_EVENTS.map((ev) => (
                          <tr key={ev.id} className="transition-colors hover:bg-gray-50">
                            <td className="whitespace-nowrap px-5 py-3.5 text-gray-700">{ev.fecha}</td>
                            <td className="whitespace-nowrap px-5 py-3.5 text-gray-700">{ev.duracion}</td>
                            <td className="px-5 py-3.5 text-gray-700">{ev.tipoIntervencion}</td>
                            <td className="px-5 py-3.5 text-center text-gray-700">{ev.valenciaSAM}</td>
                            <td className="px-5 py-3.5 text-center text-gray-700">{ev.arousalSAM}</td>
                            <td className="px-5 py-3.5">
                              {/* PLACEHOLDER link — replace with /dashboard/doctor/events/{id} */}
                              <button
                                className="text-xs font-medium transition hover:underline focus:outline-none"
                                style={{ color: "#4A7FA5" }}
                              >
                                Ver detalles
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Export button */}
                <div className="flex justify-end">
                  {/* PLACEHOLDER action — replace with GET /patients/{id}/export?format=csv&from=&to= */}
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                    style={{
                      backgroundColor: "#D6E8F5",
                      color: "#2d5a7a",
                      border: "1.5px solid #4A7FA5",
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Exportar datos CSV
                  </button>
                </div>

              </div>
            ) : (
              /* Empty state */
              <div
                className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
                style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="#D6E8F5" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <p className="text-sm font-semibold text-gray-500">
                  Selecciona un paciente para ver su panel clínico
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Los datos biométricos y eventos de crisis se cargarán aquí.
                </p>
              </div>
            )}

          </div>
        )}

        {activeTab === "Historial" && (
          <HistorialView role="DOCTOR" linkedPatients={linkedPatients} userToken={user.token} />
        )}

        {activeTab === "Configuración" && (
          <ConfiguracionView role="DOCTOR" user={user} token={user.token} linkedPatients={linkedPatients} />
        )}

      </main>
    </div>
  );
}
