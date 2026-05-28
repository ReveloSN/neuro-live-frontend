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
  bpm: number;
  spo2: number;
  bpmSeries: number[];
  spo2Series: number[];
  alerts: { dot: string; label: string; time: string }[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Normal: { bg: "#D1FAE5", color: "#065F46" },
  Riesgo: { bg: "#FEF3C7", color: "#92400E" },
  Crisis: { bg: "#FEE2E2", color: "#991B1B" },
};

const PALETTE_COLORS = [
  { name: "Verde",       hex: "#4ADE80" },
  { name: "Azul",        hex: "#60A5FA" },
  { name: "Rojo",        hex: "#F87171" },
  { name: "Rojo oscuro", hex: "#991B1B" },
  { name: "Beige",       hex: "#D6B99A" },
];

const AUDIO_OPTIONS = ["Lluvia", "Bosque", "Silencio"] as const;
type AudioOption = (typeof AUDIO_OPTIONS)[number];
type Tab = "Mis Pacientes" | "Historial" | "Configuración";

// ── Shared components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "#F3F4F6", color: "#374151" };
  return (
    <span
      className="inline-block rounded-full px-3 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

function BiometricChart({
  bpmData,
  spo2Data,
}: {
  bpmData: number[];
  spo2Data: number[];
}) {
  const W = 320;
  const H = 80;
  const PAD = { top: 8, right: 12, bottom: 8, left: 8 };

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
      aria-label="Gráfico biométrico en tiempo real"
    >
      <line x1={PAD.left} x2={W - PAD.right} y1={H / 2} y2={H / 2} stroke="#E5E7EB" strokeWidth={1} />
      <path d={bpmPath}  fill="none" stroke="#4A7FA5" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <path d={spo2Path} fill="none" stroke="#22C55E" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Patient list view ────────────────────────────────────────────────────────

function PatientList({
  patients,
  loading,
  error,
  onSelect,
}: {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  onSelect: (p: Patient) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Pacientes</h1>
        {!loading && !error && (
          <p className="mt-1 text-sm text-gray-500">
            {patients.length} pacientes asignados
          </p>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4"
            style={{ borderColor: "#4A7FA5", borderTopColor: "transparent" }}
            aria-label="Cargando pacientes"
          />
        </div>
      )}

      {!loading && error && (
        <p className="rounded-xl px-5 py-4 text-sm text-red-600" style={{ backgroundColor: "#FEE2E2" }}>
          {error}
        </p>
      )}

      {!loading && !error && patients.length === 0 && (
        <p className="rounded-xl px-5 py-6 text-center text-sm text-gray-500" style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}>
          No tienes pacientes vinculados aún. Ve a la pestaña Vinculación para conectarte con un paciente.
        </p>
      )}

      {!loading && !error && patients.length > 0 && (
        <ul className="space-y-3">
          {patients.map((patient) => (
            <li
              key={patient.id}
              className="flex items-center gap-4 rounded-2xl px-5 py-4"
              style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
            >
              {/* Avatar */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white select-none"
                style={{ backgroundColor: "#4A7FA5" }}
                aria-hidden="true"
              >
                {patient.name.charAt(0).toUpperCase()}
              </div>

              {/* Name + badge */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{patient.name}</p>
                <div className="mt-1">
                  <StatusBadge status={patient.status} />
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => onSelect(patient)}
                className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                style={{ backgroundColor: "#4A7FA5" }}
              >
                Ver datos
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Patient detail view ──────────────────────────────────────────────────────

function PatientDetail({
  patient,
  onBack,
  lightOn,
  setLightOn,
  activeColor,
  setActiveColor,
  activeAudio,
  setActiveAudio,
  onHistorial,
}: {
  patient: Patient;
  onBack: () => void;
  lightOn: boolean;
  setLightOn: (v: boolean) => void;
  activeColor: string;
  setActiveColor: (c: string) => void;
  activeAudio: AudioOption;
  setActiveAudio: (a: AudioOption) => void;
  onHistorial: () => void;
}) {
  return (
    <div className="space-y-5">

      {/* Back + patient heading */}
      <div>
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1.5 text-sm font-medium transition hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 rounded"
          style={{ color: "#4A7FA5" }}
        >
          <span aria-hidden="true">←</span> Volver
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
          <StatusBadge status={patient.status} />
        </div>
        <p className="mt-1 text-sm text-gray-500">Panel de Cuidador — datos del paciente</p>
      </div>

      {/* ── Biometric status ─────────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-5"
        style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
        aria-labelledby="biometric-heading"
      >
        <h2 id="biometric-heading" className="text-sm font-semibold text-gray-700 mb-4">
          Estado biométrico en tiempo real
        </h2>

        <div className="flex items-start gap-6 flex-wrap">
          {/* BPM — PLACEHOLDER: replace with GET /patients/{id}/biometric-data */}
          <div className="min-w-[90px]">
            <p className="text-3xl font-bold" style={{ color: "#4A7FA5" }}>
              {patient.bpm}
              <span className="ml-1 text-sm font-normal text-gray-400">BPM</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">Ritmo cardíaco</p>
          </div>

          {/* SpO2 — PLACEHOLDER: replace with GET /patients/{id}/biometric-data */}
          <div className="min-w-[90px]">
            <p className="text-3xl font-bold" style={{ color: "#22C55E" }}>
              {patient.spo2}
              <span className="ml-1 text-sm font-normal text-gray-400">%</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">Oxigenación</p>
          </div>

          {/* Chart — PLACEHOLDER: replace with streaming data from /patients/{id}/biometric-data */}
          <div className="flex-1 min-w-[200px]">
            <BiometricChart bpmData={patient.bpmSeries} spo2Data={patient.spo2Series} />
            <div className="mt-1 flex gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-4 rounded-full" style={{ backgroundColor: "#4A7FA5" }} />
                BPM
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-4 rounded-full" style={{ backgroundColor: "#22C55E" }} />
                SpO2
              </span>
            </div>
          </div>
        </div>

        {/* PLACEHOLDER timestamp — replace with real last-update time */}
        <p className="mt-3 text-xs text-gray-400">Última actualización: hace 2 seg</p>
      </section>

      {/* ── Environmental control ─────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-5"
        style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
        aria-labelledby="env-heading"
      >
        <h2 id="env-heading" className="text-sm font-semibold text-gray-700 mb-4">
          Control ambiental
        </h2>

        {/* Lighting toggle */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm text-gray-700">Iluminación</span>
          <button
            role="switch"
            aria-checked={lightOn}
            onClick={() => setLightOn(!lightOn)}
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
            style={{ backgroundColor: lightOn ? "#4A7FA5" : "#D1D5DB" }}
          >
            <span className="sr-only">{lightOn ? "Encendido" : "Apagado"}</span>
            <span
              className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
              style={{ transform: lightOn ? "translateX(22px)" : "translateX(3px)" }}
            />
          </button>
          <span className="w-16 text-right text-xs text-gray-400 select-none">
            {lightOn ? "Encendido" : "Apagado"}
          </span>
        </div>

        {/* Color palette */}
        <div className="mb-5">
          <p className="mb-2 text-xs text-gray-400">Color de ambiente</p>
          <div className="flex gap-3">
            {PALETTE_COLORS.map((c) => (
              <button
                key={c.hex}
                title={c.name}
                aria-label={c.name}
                onClick={() => setActiveColor(c.hex)}
                className="h-8 w-8 rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{
                  backgroundColor: c.hex,
                  boxShadow: activeColor === c.hex ? `0 0 0 3px white, 0 0 0 5px ${c.hex}` : undefined,
                  transform: activeColor === c.hex ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Ambient audio */}
        <div>
          <p className="mb-2 text-xs text-gray-400">Audio ambiental</p>
          <div className="flex flex-wrap gap-2">
            {AUDIO_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setActiveAudio(opt)}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                style={{
                  backgroundColor: activeAudio === opt ? "#D6E8F5" : "#F3F4F6",
                  color: activeAudio === opt ? "#2d5a7a" : "#6B7280",
                  border: activeAudio === opt ? "1.5px solid #4A7FA5" : "1.5px solid transparent",
                }}
                aria-pressed={activeAudio === opt}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent alerts ─────────────────────────────────────────────────── */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
        aria-labelledby="alerts-heading"
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #E5E7EB" }}
        >
          <h2 id="alerts-heading" className="text-sm font-semibold text-gray-700">
            Alertas recientes
          </h2>
          {/* PLACEHOLDER link — wire to /dashboard/caregiver/historial?patient={id} */}
          <button
            className="text-xs font-medium transition hover:underline focus:outline-none"
            style={{ color: "#4A7FA5" }}
            onClick={onHistorial}
          >
            Ver historial
          </button>
        </div>

        {/* PLACEHOLDER alerts — replace with GET /patients/{id}/alerts */}
        <ul className="divide-y divide-gray-50">
          {patient.alerts.map((alert, i) => (
            <li key={i} className="flex items-center gap-3 px-5 py-3.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: alert.dot }}
                aria-hidden="true"
              />
              <span className="flex-1 text-sm text-gray-700">{alert.label}</span>
              <span className="shrink-0 text-xs text-gray-400">{alert.time}</span>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CaregiverDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const { patients: linkedPatients, loading: patientsLoading, error: patientsError } =
    useLinkedPatients(user?.token ?? "", user?.role ?? "");

  const patients: Patient[] = linkedPatients.map((lp) => ({
    id: String(lp.id),
    name: `Paciente ${lp.patientId}`,
    status: "Normal" as const,
    bpm: 0,
    spo2: 0,
    bpmSeries: [0, 0],
    spo2Series: [0, 0],
    alerts: [],
  }));

  const [activeTab, setActiveTab]           = useState<Tab>("Mis Pacientes");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Environmental controls — persisted across patient views
  const [lightOn, setLightOn]         = useState(true);
  const [activeColor, setActiveColor] = useState<string>(PALETTE_COLORS[0].hex);
  const [activeAudio, setActiveAudio] = useState<AudioOption>("Silencio");

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function handleSelectPatient(p: Patient) {
    setSelectedPatient(p);
  }

  function handleBack() {
    setSelectedPatient(null);
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    // Going to another tab clears the patient selection
    if (tab !== "Mis Pacientes") setSelectedPatient(null);
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Load per-patient environmental settings when selected patient changes
  useEffect(() => {
    if (!selectedPatient) return;
    try {
      const raw = localStorage.getItem(`nl_env_${selectedPatient.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.lightOn === "boolean") setLightOn(parsed.lightOn);
        if (typeof parsed.activeColor === "string") setActiveColor(parsed.activeColor);
        if (
          typeof parsed.activeAudio === "string" &&
          (AUDIO_OPTIONS as readonly string[]).includes(parsed.activeAudio)
        )
          setActiveAudio(parsed.activeAudio as AudioOption);
        return;
      }
    } catch {
      // ignore malformed entries
    }
    setLightOn(true);
    setActiveColor("#4ADE80");
    setActiveAudio("Silencio");
  }, [selectedPatient]);

  // Save per-patient environmental settings whenever they change
  useEffect(() => {
    if (!selectedPatient) return;
    try {
      localStorage.setItem(
        `nl_env_${selectedPatient.id}`,
        JSON.stringify({ lightOn, activeColor, activeAudio })
      );
    } catch {
      // localStorage unavailable
    }
  }, [lightOn, activeColor, activeAudio, selectedPatient]);

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

  const tabs: Tab[] = ["Mis Pacientes", "Historial", "Configuración"];

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

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {activeTab === "Mis Pacientes" && (
          selectedPatient ? (
            <PatientDetail
              patient={selectedPatient}
              onBack={handleBack}
              lightOn={lightOn}
              setLightOn={setLightOn}
              activeColor={activeColor}
              setActiveColor={setActiveColor}
              activeAudio={activeAudio}
              setActiveAudio={setActiveAudio}
              onHistorial={() => handleTabChange("Historial")}
            />
          ) : (
            <PatientList
              patients={patients}
              loading={patientsLoading}
              error={patientsError}
              onSelect={handleSelectPatient}
            />
          )
        )}

        {activeTab === "Historial" && (
          <HistorialView role="CAREGIVER" linkedPatients={linkedPatients} userToken={user.token} />
        )}

        {activeTab === "Configuración" && (
          <ConfiguracionView role="CAREGIVER" user={user} token={user.token} />
        )}

      </main>
    </div>
  );
}
