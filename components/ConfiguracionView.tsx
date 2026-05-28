"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/lib/types";

export type ConfiguracionRole = UserRole;

const ROLE_LABELS: Record<ConfiguracionRole, string> = {
  USER_PERSONAL: "Usuario Personal",
  PATIENT: "Paciente",
  CAREGIVER: "Cuidador",
  DOCTOR: "Médico",
};

const API_BASE = "https://neurolive-backend.azurewebsites.net";

interface UserProfile {
  id: string;
  email: string;
  name: string;
}

interface ThresholdValues {
  bpmMin: number;
  bpmMax: number;
  spo2Min: number;
}

const DEFAULT_THRESHOLDS: ThresholdValues = { bpmMin: 60, bpmMax: 100, spo2Min: 95 };

const THRESH_RULES = {
  bpmMin:  { min: 30,  max: 100 },
  bpmMax:  { min: 60,  max: 220 },
  spo2Min: { min: 70,  max: 100 },
} as const;

export default function ConfiguracionView({
  role,
  user,
  token,
  linkedPatients,
}: {
  role: ConfiguracionRole;
  user: { name: string; token: string };
  token: string;
  linkedPatients?: Array<{ id: number; patientId: number; linkType: string }>;
}) {
  const router = useRouter();
  const { login } = useAuth();

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user.name);
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // ── Biometric consent state (PATIENT only) ─────────────────────────────────
  const [consentOn, setConsentOn] = useState(false);
  const [consentDate, setConsentDate] = useState<string | null>(null);
  const [savingConsent, setSavingConsent] = useState(false);
  const [loadingConsent, setLoadingConsent] = useState(role === "PATIENT");
  const [consentMsg, setConsentMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // ── Clinical thresholds state (DOCTOR only) ────────────────────────────────
  const clinicalPatients = (linkedPatients ?? []).map((lp) => ({
    id: String(lp.id),
    name: `Paciente ${lp.patientId}`,
  }));
  const [threshPatientId, setThreshPatientId] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, ThresholdValues>>({});
  const [savingThresh, setSavingThresh] = useState(false);
  const [threshMsg, setThreshMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (role === "PATIENT") setLoadingConsent(false);
          return;
        }
        const data = await res.json();
        const fetched: UserProfile = {
          id: data.id ?? data.userId ?? "",
          email: data.email ?? "",
          name: data.name ?? user.name,
        };
        setProfile(fetched);
        setNameValue(fetched.name);

        if (role === "PATIENT" && fetched.id) {
          try {
            const cRes = await fetch(
              `${API_BASE}/users/patients/${fetched.id}/clinical-profile`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (cRes.ok) {
              const cData = await cRes.json();
              if (typeof cData.consentGiven === "boolean") {
                setConsentOn(cData.consentGiven);
                if (cData.consentGiven && cData.consentDate) {
                  const d = new Date(String(cData.consentDate));
                  setConsentDate(
                    isNaN(d.getTime())
                      ? String(cData.consentDate)
                      : d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
                  );
                }
              }
            }
          } catch {
            // default to false on error
          } finally {
            setLoadingConsent(false);
          }
        }
      } catch {
        if (role === "PATIENT") setLoadingConsent(false);
      }
    }
    fetchProfile();
  }, [token, user.name, role]);

  // Load per-patient thresholds from localStorage when linkedPatients changes (DOCTOR only)
  useEffect(() => {
    if (role !== "DOCTOR") return;
    const patients = (linkedPatients ?? []).map((lp) => ({
      id: String(lp.id),
      name: `Paciente ${lp.patientId}`,
    }));
    setThresholds((prev) => {
      const updated = { ...prev };
      for (const p of patients) {
        try {
          const raw = localStorage.getItem(`nl_thresholds_${p.name}`);
          if (!raw) continue;
          const parsed = JSON.parse(raw) as Partial<ThresholdValues>;
          if (
            typeof parsed.bpmMin === "number" &&
            typeof parsed.bpmMax === "number" &&
            typeof parsed.spo2Min === "number"
          ) {
            updated[p.id] = parsed as ThresholdValues;
          }
        } catch {
          // ignore malformed entries
        }
      }
      return updated;
    });
  }, [role, linkedPatients]);

  async function handleSaveName() {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    setSavingName(true);
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      setProfile((p) => (p ? { ...p, name: trimmed } : p));
      login(token, role, trimmed); // refreshes auth context so the header avatar updates
      setEditingName(false);
      setNameMsg({ text: "Nombre actualizado correctamente", ok: true });
      setTimeout(() => setNameMsg(null), 3000);
    } catch {
      setNameMsg({ text: "No se pudo actualizar el nombre. Inténtalo de nuevo.", ok: false });
    } finally {
      setSavingName(false);
    }
  }

  async function handleConsentToggle() {
    const next = !consentOn;
    setConsentOn(next);
    if (!next) {
      setConsentDate(null);
      return;
    }
    const patientId = profile?.id;
    if (!patientId) return;
    setSavingConsent(true);
    try {
      const res = await fetch(`${API_BASE}/biometrics/patients/${patientId}/consent`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const now = new Date();
        setConsentDate(
          now.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
        );
        setConsentMsg({ text: "Consentimiento registrado correctamente", ok: true });
        setTimeout(() => setConsentMsg(null), 3000);
      } else {
        setConsentOn(false);
        const msg =
          res.status === 403
            ? "Solo el paciente puede registrar este consentimiento"
            : "Error al registrar el consentimiento. Intenta de nuevo.";
        setConsentMsg({ text: msg, ok: false });
      }
    } catch {
      setConsentOn(false);
      setConsentMsg({ text: "Error al registrar el consentimiento. Intenta de nuevo.", ok: false });
    } finally {
      setSavingConsent(false);
    }
  }

  function updateThreshold(field: keyof ThresholdValues, value: number) {
    if (!threshPatientId) return;
    setThresholds((prev) => ({
      ...prev,
      [threshPatientId]: { ...(prev[threshPatientId] ?? DEFAULT_THRESHOLDS), [field]: value },
    }));
  }

  async function handleSaveThresholds() {
    if (!threshPatientId) return;
    const lp = (linkedPatients ?? []).find((p) => String(p.id) === threshPatientId);
    if (!lp) return;
    const realPatientId = lp.patientId;
    const patient = clinicalPatients.find((p) => p.id === threshPatientId);
    const values = thresholds[threshPatientId] ?? DEFAULT_THRESHOLDS;
    setSavingThresh(true);
    try {
      const res = await fetch(`${API_BASE}/biometrics/patients/${realPatientId}/thresholds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bpmMin: values.bpmMin,
          bpmMax: values.bpmMax,
          spo2Min: values.spo2Min,
          errorRateMax: 0.3,
        }),
      });
      if (res.ok) {
        if (patient) {
          try {
            localStorage.setItem(`nl_thresholds_${patient.name}`, JSON.stringify(values));
          } catch {
            // localStorage unavailable
          }
        }
        setThreshMsg({ text: "Umbrales guardados correctamente", ok: true });
        setTimeout(() => setThreshMsg(null), 3000);
      } else if (res.status === 403) {
        setThreshMsg({ text: "No tienes permiso para configurar umbrales de este paciente", ok: false });
      } else {
        setThreshMsg({ text: "Error al guardar los umbrales. Intenta de nuevo.", ok: false });
      }
    } catch {
      setThreshMsg({ text: "Error al guardar los umbrales. Intenta de nuevo.", ok: false });
    } finally {
      setSavingThresh(false);
    }
  }

  const displayName = profile?.name ?? user.name;
  const displayEmail = profile?.email ?? "";

  // Per-patient threshold values and validation
  const currentThresh = threshPatientId
    ? (thresholds[threshPatientId] ?? DEFAULT_THRESHOLDS)
    : DEFAULT_THRESHOLDS;

  const threshErrors = {
    bpmMin:
      currentThresh.bpmMin < THRESH_RULES.bpmMin.min ||
      currentThresh.bpmMin > THRESH_RULES.bpmMin.max
        ? `${THRESH_RULES.bpmMin.min}–${THRESH_RULES.bpmMin.max}`
        : null,
    bpmMax:
      currentThresh.bpmMax < THRESH_RULES.bpmMax.min ||
      currentThresh.bpmMax > THRESH_RULES.bpmMax.max
        ? `${THRESH_RULES.bpmMax.min}–${THRESH_RULES.bpmMax.max}`
        : null,
    spo2Min:
      currentThresh.spo2Min < THRESH_RULES.spo2Min.min ||
      currentThresh.spo2Min > THRESH_RULES.spo2Min.max
        ? `${THRESH_RULES.spo2Min.min}–${THRESH_RULES.spo2Min.max}`
        : null,
  };
  const threshHasError = Object.values(threshErrors).some(Boolean);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      {/* ── Section 1: Mi perfil ─────────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
        aria-labelledby="cfg-perfil-heading"
      >
        <h2 id="cfg-perfil-heading" className="text-sm font-semibold text-gray-700">
          Mi perfil
        </h2>

        {/* Avatar + editable name */}
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white select-none"
            style={{ backgroundColor: "#4A7FA5" }}
            aria-hidden="true"
          >
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0 pt-1">
            {editingName ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ border: "1.5px solid #D6E8F5", backgroundColor: "#FAFAFA" }}
                  aria-label="Nombre completo"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveName}
                    disabled={savingName || !nameValue.trim()}
                    className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                    style={{ backgroundColor: "#4A7FA5" }}
                  >
                    {savingName ? "Guardando…" : "Guardar cambios"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameValue(displayName);
                    }}
                    className="rounded-lg px-4 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                <button
                  onClick={() => setEditingName(true)}
                  className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                  style={{ color: "#4A7FA5" }}
                  aria-label="Editar nombre"
                >
                  Editar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Name save feedback */}
        {nameMsg && (
          <p
            className="rounded-lg px-3 py-2 text-xs font-medium"
            style={{
              color: nameMsg.ok ? "#065F46" : "#991B1B",
              backgroundColor: nameMsg.ok ? "#D1FAE5" : "#FEE2E2",
            }}
            role="status"
          >
            {nameMsg.text}
          </p>
        )}

        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500">Correo electrónico</p>
          <div className="flex items-center gap-2">
            <LockIcon />
            <span className="text-sm text-gray-600">{displayEmail || "—"}</span>
          </div>
        </div>

        {/* Role badge */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500">Rol</p>
          <span
            className="inline-block rounded-full px-3 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: "#D6E8F5", color: "#2d5a7a" }}
          >
            {ROLE_LABELS[role]}
          </span>
        </div>
      </section>

      {/* ── Section 2: Seguridad ─────────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
        aria-labelledby="cfg-seguridad-heading"
      >
        <h2 id="cfg-seguridad-heading" className="text-sm font-semibold text-gray-700">
          Seguridad
        </h2>

        <div>
          <button
            onClick={() => router.push("/forgot-password")}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
            style={{ backgroundColor: "#4A7FA5" }}
          >
            Cambiar contraseña
          </button>
          <p className="mt-2 text-xs text-gray-400">
            Recibirás un código en tu correo registrado
          </p>
        </div>
      </section>

      {/* ── Section 3 (PATIENT): Consentimiento biométrico ──────────────────── */}
      {role === "PATIENT" && (
        <section
          className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
          aria-labelledby="cfg-consent-heading"
        >
          <h2 id="cfg-consent-heading" className="text-sm font-semibold text-gray-700">
            Consentimiento biométrico
          </h2>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700">
              Autorizo el procesamiento de mis datos biométricos
            </span>
            <div className="flex items-center gap-2">
              {loadingConsent && (
                <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <button
                role="switch"
                aria-checked={consentOn}
                aria-label={loadingConsent ? "Verificando estado del consentimiento…" : consentOn ? "Activado" : "Desactivado"}
                onClick={handleConsentToggle}
                disabled={savingConsent || loadingConsent}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 disabled:opacity-50"
                style={{ backgroundColor: consentOn ? "#4A7FA5" : "#D1D5DB" }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                  style={{ transform: consentOn ? "translateX(22px)" : "translateX(3px)" }}
                />
              </button>
            </div>
          </div>

          {consentMsg && (
            <p
              className="rounded-lg px-3 py-2 text-xs font-medium"
              style={{
                color: consentMsg.ok ? "#065F46" : "#991B1B",
                backgroundColor: consentMsg.ok ? "#D1FAE5" : "#FEE2E2",
              }}
              role="status"
            >
              {consentMsg.text}
            </p>
          )}

          <p className="text-xs text-gray-400">
            {consentDate
              ? `Consentimiento otorgado el ${consentDate}`
              : "Sin consentimiento activo"}
          </p>

          <div
            className="rounded-xl p-4 text-xs leading-relaxed"
            style={{ backgroundColor: "#D6E8F5", color: "#2d5a7a" }}
          >
            Tus datos están cifrados y solo se usan para mejorar tu experiencia. Puedes revocar
            este permiso en cualquier momento.
          </div>
        </section>
      )}

      {/* ── Section 3 (DOCTOR): Umbrales clínicos ───────────────────────────── */}
      {role === "DOCTOR" && (
        <section
          className="rounded-2xl p-6 space-y-5"
          style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
          aria-labelledby="cfg-thresholds-heading"
        >
          <h2 id="cfg-thresholds-heading" className="text-sm font-semibold text-gray-700">
            Umbrales clínicos
          </h2>

          {/* Patient selector */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">Seleccionar paciente</p>
            {clinicalPatients.length === 0 ? (
              <p className="text-sm text-gray-500">
                No tienes pacientes vinculados aún. Ve a Vinculación para conectarte.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {clinicalPatients.map((p) => {
                  const isSel = threshPatientId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setThreshPatientId(isSel ? null : p.id)}
                      aria-pressed={isSel}
                      className="rounded-xl px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                      style={{
                        backgroundColor: isSel ? "#D6E8F5" : "#ffffff",
                        border: `1.5px solid ${isSel ? "#4A7FA5" : "#E5E7EB"}`,
                        color: isSel ? "#2d5a7a" : "#374151",
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Threshold inputs — rendered only when a patient is selected */}
          {threshPatientId && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start gap-4">

                {/* BPM Mínimo */}
                <div>
                  <label
                    className="block text-xs font-medium text-gray-500 mb-1.5"
                    htmlFor="cfg-bpmMin"
                  >
                    BPM Mínimo
                  </label>
                  <input
                    id="cfg-bpmMin"
                    type="number"
                    value={currentThresh.bpmMin}
                    onChange={(e) => updateThreshold("bpmMin", parseInt(e.target.value, 10) || 0)}
                    className="w-24 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    style={{
                      border: `1.5px solid ${threshErrors.bpmMin ? "#EF4444" : "#D6E8F5"}`,
                      backgroundColor: "#FAFAFA",
                    }}
                    min={THRESH_RULES.bpmMin.min}
                    max={THRESH_RULES.bpmMin.max}
                  />
                  {threshErrors.bpmMin && (
                    <p className="mt-1 text-xs font-medium" style={{ color: "#EF4444" }}>
                      Rango: {threshErrors.bpmMin}
                    </p>
                  )}
                </div>

                {/* BPM Máximo */}
                <div>
                  <label
                    className="block text-xs font-medium text-gray-500 mb-1.5"
                    htmlFor="cfg-bpmMax"
                  >
                    BPM Máximo
                  </label>
                  <input
                    id="cfg-bpmMax"
                    type="number"
                    value={currentThresh.bpmMax}
                    onChange={(e) => updateThreshold("bpmMax", parseInt(e.target.value, 10) || 0)}
                    className="w-24 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    style={{
                      border: `1.5px solid ${threshErrors.bpmMax ? "#EF4444" : "#D6E8F5"}`,
                      backgroundColor: "#FAFAFA",
                    }}
                    min={THRESH_RULES.bpmMax.min}
                    max={THRESH_RULES.bpmMax.max}
                  />
                  {threshErrors.bpmMax && (
                    <p className="mt-1 text-xs font-medium" style={{ color: "#EF4444" }}>
                      Rango: {threshErrors.bpmMax}
                    </p>
                  )}
                </div>

                {/* SpO2 Mínimo */}
                <div>
                  <label
                    className="block text-xs font-medium text-gray-500 mb-1.5"
                    htmlFor="cfg-spo2Min"
                  >
                    SpO2 Mínimo
                  </label>
                  <input
                    id="cfg-spo2Min"
                    type="number"
                    value={currentThresh.spo2Min}
                    onChange={(e) => updateThreshold("spo2Min", parseInt(e.target.value, 10) || 0)}
                    className="w-24 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    style={{
                      border: `1.5px solid ${threshErrors.spo2Min ? "#EF4444" : "#D6E8F5"}`,
                      backgroundColor: "#FAFAFA",
                    }}
                    min={THRESH_RULES.spo2Min.min}
                    max={THRESH_RULES.spo2Min.max}
                  />
                  {threshErrors.spo2Min && (
                    <p className="mt-1 text-xs font-medium" style={{ color: "#EF4444" }}>
                      Rango: {threshErrors.spo2Min}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSaveThresholds}
                disabled={threshHasError || savingThresh}
                className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                style={{ backgroundColor: "#4A7FA5" }}
              >
                {savingThresh ? "Guardando…" : "Guardar umbrales"}
              </button>

              {threshMsg && (
                <p
                  className="rounded-lg px-3 py-2 text-xs font-medium"
                  style={{
                    color: threshMsg.ok ? "#065F46" : "#991B1B",
                    backgroundColor: threshMsg.ok ? "#D1FAE5" : "#FEE2E2",
                  }}
                  role="status"
                >
                  {threshMsg.text}
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0 text-gray-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round" />
    </svg>
  );
}
