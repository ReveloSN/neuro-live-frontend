"use client";

import { useState, useEffect } from "react";

export type HistorialRole = "PATIENT" | "USER_PERSONAL" | "CAREGIVER" | "DOCTOR";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Normal: { bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  Riesgo: { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  Crisis: { bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
} as const;

type SessionStatus = keyof typeof STATUS_CONFIG;

// ─── SAM scale mappings ────────────────────────────────────────────────────────

const SAM_VALENCE = [
  { score: 1, emoji: "😢", label: "Muy triste" },
  { score: 2, emoji: "😕", label: "Triste" },
  { score: 3, emoji: "😐", label: "Neutral" },
  { score: 4, emoji: "🙂", label: "Contento" },
  { score: 5, emoji: "😄", label: "Muy contento" },
];

const SAM_AROUSAL = [
  { score: 1, emoji: "😴", label: "Sin energía" },
  { score: 2, emoji: "😌", label: "Calmado" },
  { score: 3, emoji: "😐", label: "Neutral" },
  { score: 4, emoji: "⚡", label: "Activo" },
  { score: 5, emoji: "🔥", label: "Muy activo" },
];

const SAM_DOMINANCE = [
  { score: 1, emoji: "😰", label: "Sin control" },
  { score: 2, emoji: "😟", label: "Poco control" },
  { score: 3, emoji: "😐", label: "Normal" },
  { score: 4, emoji: "💪", label: "Con control" },
  { score: 5, emoji: "🧘", label: "En paz" },
];

// ─── Session record interfaces ─────────────────────────────────────────────────

interface SessionRecord {
  id: string;
  date: string;
  duration: string;
  status: SessionStatus;
  crisisDuration?: string;
  interventionType: string;
  breathingCycles?: number;
  sam: { valence: number; arousal: number; dominance: number };
}

// Format saved to localStorage by SAMQuestionnaire
interface LocalSavedSession {
  id: string;
  date: string;
  duration: string;
  breathingCycles: number;
  valence: number;
  arousal: number;
  dominance: number;
  interventionType: string;
  status?: string;
}

// ─── PLACEHOLDER data — PATIENT / USER_PERSONAL ───────────────────────────────
// Replace with: GET /crises/patients/{patientId}

// PLACEHOLDER: sessions from GET /crises/patients/{patientId}
const PLACEHOLDER_SESSIONS: SessionRecord[] = [
  {
    id: "s1",
    date: "24 may 2026",
    duration: "38 min",
    status: "Normal",
    interventionType: "Modo Calma",
    sam: { valence: 4, arousal: 2, dominance: 4 },
  },
  {
    id: "s2",
    date: "20 may 2026",
    duration: "52 min",
    status: "Riesgo",
    crisisDuration: "3 min 10 s",
    interventionType: "Audio",
    sam: { valence: 2, arousal: 4, dominance: 2 },
  },
  {
    id: "s3",
    date: "16 may 2026",
    duration: "45 min",
    status: "Crisis",
    crisisDuration: "6 min 40 s",
    interventionType: "Luces",
    sam: { valence: 1, arousal: 5, dominance: 1 },
  },
  {
    id: "s4",
    date: "12 may 2026",
    duration: "30 min",
    status: "Normal",
    interventionType: "Modo Calma",
    sam: { valence: 5, arousal: 2, dominance: 5 },
  },
];

// ─── PLACEHOLDER data — CAREGIVER / DOCTOR ────────────────────────────────────
// Replace with: GET /crises/patients/{patientId}

interface CrisisEventRecord {
  id: string;
  date: string;
  duration: string;
  interventionType: string;
  valence: number; // 1–5 SAM scale
  arousal: number; // 1–5 SAM scale
}

// PLACEHOLDER: crisis events from GET /crises/patients/{patientId}
const PLACEHOLDER_CRISIS_EVENTS: CrisisEventRecord[] = [
  { id: "e1", date: "24 may 2026", duration: "4 min 30 s", interventionType: "Respiración guiada", valence: 2, arousal: 5 },
  { id: "e2", date: "20 may 2026", duration: "2 min 15 s", interventionType: "Música ambiental",    valence: 3, arousal: 4 },
  { id: "e3", date: "16 may 2026", duration: "6 min 10 s", interventionType: "Luz tenue",           valence: 2, arousal: 5 },
  { id: "e4", date: "12 may 2026", duration: "1 min 50 s", interventionType: "Modo Calma",          valence: 4, arousal: 3 },
];

// ─── Shared sub-components ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SessionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
      {status}
    </span>
  );
}

function SAMCard({
  label,
  options,
  score,
}: {
  label: string;
  options: { score: number; emoji: string; label: string }[];
  score: number;
}) {
  const opt = options.find((o) => o.score === score) ?? options[2];
  return (
    <div
      className="flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2.5 min-w-[80px]"
      style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
    >
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-2xl leading-none">{opt.emoji}</span>
      <span className="text-center text-xs text-gray-700">{opt.label}</span>
    </div>
  );
}

function SAMProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = ((value - 1) / 4) * 100; // 1–5 scale → 0–100%
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold" style={{ color }}>{value}/5</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ backgroundColor: color, width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0 transition-transform"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
      style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
    >
      <svg viewBox="0 0 24 24" className="mb-3 h-10 w-10" fill="none" stroke="#D6E8F5" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
      <p className="text-sm font-semibold text-gray-500">{message}</p>
    </div>
  );
}

// ─── Patient / Personal view ───────────────────────────────────────────────────

function PatientHistorial({ userToken, refreshKey }: { userToken?: string; refreshKey?: number }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    if (!userToken) {
      setSessions(PLACEHOLDER_SESSIONS);
      return;
    }
    try {
      const raw = localStorage.getItem(`nl_historial_${userToken}`);
      if (!raw) { setSessions([]); return; }
      const saved: LocalSavedSession[] = JSON.parse(raw);
      if (saved.length === 0) { setSessions([]); return; }
      setSessions(
        saved.slice().reverse().map((ls): SessionRecord => ({
          id: ls.id,
          date: ls.date,
          duration: ls.duration,
          status: (ls.status as SessionStatus | undefined) ?? "Normal",
          interventionType: ls.interventionType,
          breathingCycles: ls.breathingCycles,
          sam: { valence: ls.valence, arousal: ls.arousal, dominance: ls.dominance },
        }))
      );
    } catch {
      setSessions([]);
    }
  }, [userToken, refreshKey]);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Mi historial de sesiones</h1>

      {sessions.length === 0 ? (
        <EmptyState message="Aún no tienes sesiones registradas" />
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => {
            const open = openIds.has(s.id);
            return (
              <li
                key={s.id}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
              >
                {/* Card header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{s.date}</p>
                      <p className="text-xs text-gray-400">{s.duration}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={s.status} />
                    <button
                      onClick={() => toggle(s.id)}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                      style={{
                        backgroundColor: open ? "#D6E8F5" : "#F3F4F6",
                        color: open ? "#2d5a7a" : "#6B7280",
                      }}
                      aria-expanded={open}
                    >
                      Ver detalles
                      <ChevronIcon open={open} />
                    </button>
                  </div>
                </div>

                {/* Expandable details */}
                {open && (
                  <div
                    className="px-5 pb-5 space-y-4"
                    style={{ borderTop: "1px solid #F3F4F6" }}
                  >
                    {/* Crisis duration — only if applicable */}
                    {s.crisisDuration && (
                      <div className="flex items-center gap-2 pt-3">
                        <span className="text-xs font-semibold" style={{ color: "#991B1B" }}>
                          Duración de la crisis:
                        </span>
                        <span className="text-xs text-gray-700">{s.crisisDuration}</span>
                      </div>
                    )}

                    {/* Breathing cycles — only for Modo Calma sessions */}
                    {typeof s.breathingCycles === "number" && (
                      <div className={`flex items-center gap-2 ${!s.crisisDuration ? "pt-3" : ""}`}>
                        <span className="text-xs font-semibold text-gray-500">
                          Ciclos de respiración:
                        </span>
                        <span className="text-xs text-gray-700">{s.breathingCycles}</span>
                      </div>
                    )}

                    {/* Intervention type */}
                    <div className={`flex items-center gap-2 ${!s.crisisDuration && typeof s.breathingCycles !== "number" ? "pt-3" : ""}`}>
                      <span className="text-xs font-semibold text-gray-500">
                        Tipo de intervención:
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: "#D6E8F5", color: "#2d5a7a" }}
                      >
                        {s.interventionType}
                      </span>
                    </div>

                    {/* SAM read-only emoji cards */}
                    <div>
                      <p className="mb-2 text-xs font-semibold text-gray-500">
                        Respuestas SAM
                      </p>
                      <div className="flex gap-2">
                        {/* PLACEHOLDER: SAM scores from GET /crises/patients/{patientId} */}
                        <SAMCard label="Valencia"   options={SAM_VALENCE}   score={s.sam.valence}   />
                        <SAMCard label="Activación" options={SAM_AROUSAL}   score={s.sam.arousal}   />
                        <SAMCard label="Dominancia" options={SAM_DOMINANCE} score={s.sam.dominance} />
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Estas respuestas no pueden ser modificadas
                      </p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Caregiver view ────────────────────────────────────────────────────────────

function CaregiverHistorial({ linkedPatients }: { linkedPatients?: Array<{ id: number; patientId: number; linkType: string }> }) {
  const clinicalPatients = (linkedPatients ?? []).map((lp) => ({
    id: String(lp.id),
    name: `Paciente ${lp.patientId}`,
  }));
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [openEventIds, setOpenEventIds] = useState<Set<string>>(new Set());

  function toggleEvent(id: string) {
    setOpenEventIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleExportCSV() {
    // PLACEHOLDER: replace with GET /crises/patients/{patientId}?format=csv
    console.log("[PLACEHOLDER] Exportar CSV — GET /crises/patients/{patientId}?format=csv");
  }

  // PLACEHOLDER: events from GET /crises/patients/{patientId}
  const events = PLACEHOLDER_CRISIS_EVENTS;

  if (clinicalPatients.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Historial de mis pacientes</h1>
        <EmptyState message="No tienes pacientes vinculados aún" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Historial de mis pacientes</h1>

      {/* Patient selector */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500">Seleccionar paciente</p>
        <div className="flex flex-wrap gap-2">
          {clinicalPatients.map((p) => {
            const isSelected = selectedPatientId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(isSelected ? null : p.id)}
                aria-pressed={isSelected}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                style={{
                  backgroundColor: isSelected ? "#D6E8F5" : "#ffffff",
                  border: `1.5px solid ${isSelected ? "#4A7FA5" : "#E5E7EB"}`,
                  color: isSelected ? "#2d5a7a" : "#374151",
                }}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {selectedPatientId === null ? (
        <EmptyState message="Selecciona un paciente para ver su historial" />
      ) : events.length === 0 ? (
        <EmptyState message="No hay eventos registrados para este paciente" />
      ) : (
        <>
          {/* Crisis events */}
          <ul className="space-y-3">
            {events.map((ev) => {
              const open = openEventIds.has(ev.id);
              return (
                <li
                  key={ev.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
                >
                  {/* Event summary row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-gray-800">{ev.date}</p>
                      <p className="text-xs text-gray-400">
                        Duración: {ev.duration} · {ev.interventionType}
                      </p>
                    </div>

                    {/* SAM mini progress bars */}
                    <div className="flex-1 min-w-[180px] max-w-[260px] space-y-1.5">
                      {/* PLACEHOLDER: SAM scores from GET /crises/patients/{patientId} */}
                      <SAMProgressBar label="Valencia"   value={ev.valence} color="#4A7FA5" />
                      <SAMProgressBar label="Activación" value={ev.arousal} color="#F59E0B" />
                    </div>

                    <button
                      onClick={() => toggleEvent(ev.id)}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                      style={{
                        backgroundColor: open ? "#D6E8F5" : "#F3F4F6",
                        color: open ? "#2d5a7a" : "#6B7280",
                      }}
                      aria-expanded={open}
                    >
                      Ver detalles
                      <ChevronIcon open={open} />
                    </button>
                  </div>

                  {/* Expandable section */}
                  {open && (
                    <div
                      className="px-5 pb-5 pt-3 space-y-3"
                      style={{ borderTop: "1px solid #F3F4F6" }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">
                          Tipo de intervención:
                        </span>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: "#D6E8F5", color: "#2d5a7a" }}
                        >
                          {ev.interventionType}
                        </span>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold text-gray-500">Escala SAM</p>
                        <div className="flex gap-2">
                          {/* PLACEHOLDER: SAM scores from GET /crises/patients/{patientId} */}
                          <SAMCard label="Valencia"   options={SAM_VALENCE} score={ev.valence} />
                          <SAMCard label="Activación" options={SAM_AROUSAL} score={ev.arousal} />
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Export CSV button — visual only */}
          <div className="flex justify-end">
            {/* PLACEHOLDER: replace with GET /crises/patients/{patientId}?format=csv */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
              style={{
                backgroundColor: "#D6E8F5",
                color: "#2d5a7a",
                border: "1.5px solid #4A7FA5",
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exportar CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Doctor view ───────────────────────────────────────────────────────────────

function DoctorHistorial({ linkedPatients }: { linkedPatients?: Array<{ id: number; patientId: number; linkType: string }> }) {
  const clinicalPatients = (linkedPatients ?? []).map((lp) => ({
    id: String(lp.id),
    name: `Paciente ${lp.patientId}`,
  }));
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [openEventIds, setOpenEventIds] = useState<Set<string>>(new Set());

  function toggleEvent(id: string) {
    setOpenEventIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleExportCSV() {
    // PLACEHOLDER: replace with GET /crises/patients/{patientId}/analysis?format=csv
    console.log("[PLACEHOLDER] Exportar CSV — GET /crises/patients/{patientId}/analysis?format=csv");
  }

  // PLACEHOLDER: events from GET /crises/patients/{patientId}/analysis
  const events = PLACEHOLDER_CRISIS_EVENTS;

  if (clinicalPatients.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Historial clínico</h1>
        <EmptyState message="No tienes pacientes vinculados aún" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Historial clínico</h1>

      {/* Patient selector */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500">Seleccionar paciente</p>
        <div className="flex flex-wrap gap-2">
          {clinicalPatients.map((p) => {
            const isSelected = selectedPatientId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(isSelected ? null : p.id)}
                aria-pressed={isSelected}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                style={{
                  backgroundColor: isSelected ? "#D6E8F5" : "#ffffff",
                  border: `1.5px solid ${isSelected ? "#4A7FA5" : "#E5E7EB"}`,
                  color: isSelected ? "#2d5a7a" : "#374151",
                }}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {selectedPatientId === null ? (
        <EmptyState message="Selecciona un paciente para ver su historial clínico" />
      ) : events.length === 0 ? (
        <EmptyState message="No hay eventos registrados para este paciente" />
      ) : (
        <>
          {/* Crisis events */}
          <ul className="space-y-3">
            {events.map((ev) => {
              const open = openEventIds.has(ev.id);
              return (
                <li
                  key={ev.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
                >
                  {/* Event summary row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-gray-800">{ev.date}</p>
                      <p className="text-xs text-gray-400">
                        Duración: {ev.duration} · {ev.interventionType}
                      </p>
                    </div>

                    {/* SAM mini progress bars */}
                    <div className="flex-1 min-w-[180px] max-w-[260px] space-y-1.5">
                      {/* PLACEHOLDER: SAM scores from GET /crises/patients/{patientId}/analysis */}
                      <SAMProgressBar label="Valencia"   value={ev.valence} color="#4A7FA5" />
                      <SAMProgressBar label="Activación" value={ev.arousal} color="#F59E0B" />
                    </div>

                    <button
                      onClick={() => toggleEvent(ev.id)}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                      style={{
                        backgroundColor: open ? "#D6E8F5" : "#F3F4F6",
                        color: open ? "#2d5a7a" : "#6B7280",
                      }}
                      aria-expanded={open}
                    >
                      Ver detalles
                      <ChevronIcon open={open} />
                    </button>
                  </div>

                  {/* Expandable section */}
                  {open && (
                    <div
                      className="px-5 pb-5 pt-3 space-y-3"
                      style={{ borderTop: "1px solid #F3F4F6" }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">
                          Tipo de intervención:
                        </span>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: "#D6E8F5", color: "#2d5a7a" }}
                        >
                          {ev.interventionType}
                        </span>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold text-gray-500">Escala SAM</p>
                        <div className="flex gap-2">
                          {/* PLACEHOLDER: SAM scores from GET /crises/patients/{patientId}/analysis */}
                          <SAMCard label="Valencia"   options={SAM_VALENCE} score={ev.valence} />
                          <SAMCard label="Activación" options={SAM_AROUSAL} score={ev.arousal} />
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Export CSV button — visual only */}
          <div className="flex justify-end">
            {/* PLACEHOLDER: replace with GET /crises/patients/{patientId}/analysis?format=csv */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
              style={{
                backgroundColor: "#D6E8F5",
                color: "#2d5a7a",
                border: "1.5px solid #4A7FA5",
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exportar CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HistorialView({
  role,
  userToken,
  refreshKey,
  linkedPatients,
}: {
  role: HistorialRole;
  userToken?: string;
  refreshKey?: number;
  linkedPatients?: Array<{ id: number; patientId: number; linkType: string }>;
}) {
  if (role === "PATIENT" || role === "USER_PERSONAL")
    return <PatientHistorial userToken={userToken} refreshKey={refreshKey} />;
  if (role === "CAREGIVER") return <CaregiverHistorial linkedPatients={linkedPatients} />;
  if (role === "DOCTOR") return <DoctorHistorial linkedPatients={linkedPatients} />;
  return null;
}
