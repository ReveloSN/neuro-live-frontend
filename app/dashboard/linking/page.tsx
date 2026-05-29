"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/lib/api";

const API_BASE = getApiBaseUrl();
const LINK_CODE_PATTERN = /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g;

interface LinkRecord {
  id: string;
  patientId: string;
  linkedUserId: string;
  linkType: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  consumedAt: string | null;
}

interface GeneratedToken {
  linkId: string;
  token: string;
  expiresAt: string;
  status: string;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function translateLinkType(linkType: string | null): string {
  if (linkType === "CAREGIVER") return "Cuidador";
  if (linkType === "DOCTOR") return "Médico";
  if (linkType === "PATIENT") return "Paciente";
  return linkType ?? "Vinculado";
}

function translateStatus(status: string): string {
  if (status === "ACTIVE") return "Activo";
  if (status === "PENDING") return "Pendiente";
  if (status === "EXPIRED") return "Expirado";
  if (status === "REVOKED") return "Revocado";
  return status;
}

function normalizeLinkCodeInput(value: string): string {
  return value.toUpperCase().replace(LINK_CODE_PATTERN, "").slice(0, 6);
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  let bg = "#E5E7EB";
  let color = "#374151";
  if (s === "active" || s === "activo" || s === "consumed" || s === "consumido") {
    bg = "#D1FAE5";
    color = "#065F46";
  } else if (s === "expired" || s === "expirado") {
    bg = "#FEE2E2";
    color = "#991B1B";
  } else if (s === "pending" || s === "pendiente") {
    bg = "#FEF3C7";
    color = "#92400E";
  }
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-semibold capitalize"
      style={{ backgroundColor: bg, color }}
    >
      {status}
    </span>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="8.5" />
      <path d="M6.5 10l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <div
      className="h-6 w-6 animate-spin rounded-full border-4"
      style={{ borderColor: "#4A7FA5", borderTopColor: "transparent" }}
      aria-label="Cargando"
    />
  );
}

export default function LinkingPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Patient — generate token
  const [generatedToken, setGeneratedToken] = useState<GeneratedToken | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [copied, setCopied] = useState(false);

  // Caregiver / Doctor — redeem token
  const [redeemInput, setRedeemInput] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [redeemError, setRedeemError] = useState("");

  // Shared — links list
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linksError, setLinksError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const fetchLinks = useCallback(async () => {
    if (!user) return;
    setLinksLoading(true);
    setLinksError("");
    try {
      const res = await fetch(`${API_BASE}/links/me`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: unknown = await res.json();
      setLinks(Array.isArray(data) ? (data as LinkRecord[]) : []);
    } catch {
      setLinksError("No se pudo cargar la lista de vinculaciones.");
    } finally {
      setLinksLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchLinks();
  }, [user, fetchLinks]);

  async function handleGenerateToken() {
    if (!user) return;
    setGenerateLoading(true);
    setGenerateError("");
    try {
      const res = await fetch(`${API_BASE}/links/tokens`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as GeneratedToken;
      setGeneratedToken(data);
    } catch {
      setGenerateError("No se pudo generar el token. Intenta de nuevo.");
    } finally {
      setGenerateLoading(false);
    }
  }

  async function handleRedeem() {
    if (!user || redeemInput.trim().length < 6) return;
    setRedeemLoading(true);
    setRedeemError("");
    setRedeemSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/links/redeem`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: redeemInput.trim() }),
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Token no encontrado o ya expirado.");
        if (res.status === 409) throw new Error("Este token ya fue utilizado.");
        throw new Error("No se pudo completar la vinculación. Verifica el token e intenta de nuevo.");
      }
      setRedeemSuccess(true);
      setRedeemInput("");
      fetchLinks();
    } catch (err: unknown) {
      setRedeemError(err instanceof Error ? err.message : "Error al vincular. Intenta de nuevo.");
    } finally {
      setRedeemLoading(false);
    }
  }

  function handleCopy() {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken.token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function handleBackToDashboard() {
    if (!user) return;
    const routes: Record<string, string> = {
      PATIENT: "/dashboard/patient",
      DOCTOR: "/dashboard/doctor",
      CAREGIVER: "/dashboard/caregiver",
      USER_PERSONAL: "/dashboard/personal",
    };
    router.push(routes[user.role] ?? "/dashboard/patient");
  }

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

  const isPatient = user.role === "PATIENT";
  const isCaregiverOrDoctor = user.role === "CAREGIVER" || user.role === "DOCTOR";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8" }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-3 shadow-sm"
        style={{ backgroundColor: "#ffffff" }}
      >
        <span
          className="shrink-0 text-xl font-bold tracking-tight"
          style={{ color: "#4A7FA5" }}
        >
          NeuroLive
        </span>

        <nav className="flex items-center gap-1" aria-label="Navegación principal">
          <button
            onClick={handleBackToDashboard}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
            style={{ backgroundColor: "transparent", color: "#6B7280" }}
          >
            Escritorio
          </button>
          <div className="mx-1 h-5 w-px flex-shrink-0" style={{ backgroundColor: "#E5E7EB" }} />
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
            style={{ backgroundColor: "#D6E8F5", color: "#2d5a7a" }}
            aria-current="page"
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

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#1e3a4f" }}>
            Vinculación de cuentas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Conecta tu cuenta con un cuidador o médico
          </p>
        </div>

        <div className="space-y-6">
          {/* ── PATIENT ──────────────────────────────────────────────────── */}
          {isPatient && (
            <>
              {/* Section 1 — Generate token */}
              <section
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
              >
                <h2 className="text-base font-semibold" style={{ color: "#1e3a4f" }}>
                  Generar token de vinculación
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Comparte este token con tu cuidador o médico
                </p>

                <button
                  onClick={handleGenerateToken}
                  disabled={generateLoading}
                  className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60"
                  style={{ backgroundColor: "#4A7FA5" }}
                >
                  {generateLoading ? "Generando..." : "Generar token"}
                </button>

                {generateError && (
                  <p className="mt-3 text-sm" style={{ color: "#991B1B" }}>
                    {generateError}
                  </p>
                )}

                {generatedToken && (
                  <div
                    className="mt-5 rounded-xl p-5"
                    style={{ backgroundColor: "#D6E8F5", border: "1px solid #A8D0EF" }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-3"
                      style={{ color: "#2d5a7a" }}
                    >
                      Tu token de vinculación
                    </p>

                    <div className="flex items-center gap-3">
                      <span
                        className="flex-1 rounded-lg px-4 py-3 text-xl font-bold text-center font-mono"
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#1e3a4f",
                          border: "2px solid #4A7FA5",
                          letterSpacing: "0.25em",
                        }}
                      >
                        {generatedToken.token}
                      </span>
                      <button
                        onClick={handleCopy}
                        className="shrink-0 rounded-lg px-4 py-3 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1"
                        style={{
                          backgroundColor: copied ? "#D1FAE5" : "#4A7FA5",
                          color: copied ? "#065F46" : "#ffffff",
                        }}
                        aria-label="Copiar token"
                      >
                        {copied ? "Copiado" : "Copiar"}
                      </button>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs" style={{ color: "#2d5a7a" }}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Estado:</span>
                        <span className="capitalize">{translateStatus(generatedToken.status)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Expira:</span>
                        <span>{formatDate(generatedToken.expiresAt)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Section 2 — My links */}
              <section
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
              >
                <h2 className="text-base font-semibold" style={{ color: "#1e3a4f" }}>
                  Mis vinculaciones
                </h2>

                {linksLoading ? (
                  <div className="mt-4 flex justify-center">
                    <Spinner />
                  </div>
                ) : linksError ? (
                  <p className="mt-3 text-sm" style={{ color: "#991B1B" }}>
                    {linksError}
                  </p>
                ) : links.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-400">
                    Aún no tienes vinculaciones activas
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-gray-100">
                    {links.map((link) => (
                      <li
                        key={link.id}
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-700">{translateLinkType(link.linkType)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Vinculado: {formatDate(link.createdAt)}
                            {link.expiresAt && (
                              <> · Expira: {formatDate(link.expiresAt)}</>
                            )}
                          </p>
                        </div>
                        <StatusPill status={translateStatus(link.status)} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {/* ── CAREGIVER / DOCTOR ────────────────────────────────────────── */}
          {isCaregiverOrDoctor && (
            <>
              {/* Section 1 — Redeem token */}
              <section
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
              >
                <h2 className="text-base font-semibold" style={{ color: "#1e3a4f" }}>
                  Ingresar token de vinculación
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Ingresa el token que te proporcionó el paciente
                </p>

                <div className="mt-4 flex gap-3">
                  <input
                    type="text"
                    value={redeemInput}
                    onChange={(e) => setRedeemInput(normalizeLinkCodeInput(e.target.value))}
                    placeholder="Token de 6 caracteres"
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal border focus:outline-none focus:ring-2 focus:ring-blue-300"
                    style={{ borderColor: "#E5E7EB", color: "#1e3a4f" }}
                    maxLength={6}
                    aria-label="Token de vinculación"
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={redeemLoading || redeemInput.trim().length < 6}
                    className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60"
                    style={{ backgroundColor: "#4A7FA5" }}
                  >
                    {redeemLoading ? "Vinculando..." : "Vincularme"}
                  </button>
                </div>

                {redeemSuccess && (
                  <div
                    className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                    style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
                  >
                    <CheckCircleIcon />
                    Vinculación exitosa
                  </div>
                )}

                {redeemError && (
                  <p className="mt-3 text-sm" style={{ color: "#991B1B" }}>
                    {redeemError}
                  </p>
                )}
              </section>

              {/* Section 2 — Linked patients */}
              <section
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
              >
                <h2 className="text-base font-semibold" style={{ color: "#1e3a4f" }}>
                  Mis pacientes vinculados
                </h2>

                {linksLoading ? (
                  <div className="mt-4 flex justify-center">
                    <Spinner />
                  </div>
                ) : linksError ? (
                  <p className="mt-3 text-sm" style={{ color: "#991B1B" }}>
                    {linksError}
                  </p>
                ) : links.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-400">
                    Aún no tienes pacientes vinculados
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-gray-100">
                    {links.map((link) => (
                      <li
                        key={link.id}
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Paciente: {link.patientId}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {translateLinkType(link.linkType)} · Vinculado: {formatDate(link.createdAt)}
                            {link.expiresAt && (
                              <> · Expira: {formatDate(link.expiresAt)}</>
                            )}
                          </p>
                        </div>
                        <StatusPill status={translateStatus(link.status)} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
