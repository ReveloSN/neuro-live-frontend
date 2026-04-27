"use client";

import { useState, FormEvent, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://neurolive-backend.azurewebsites.net").replace(/\/$/, "");

const ERROR_MESSAGES: Record<number, string> = {
  400: "El código ingresado no es válido.",
  404: "No encontramos una cuenta con ese correo.",
  410: "El código ha expirado. Solicita uno nuevo.",
  429: "Demasiados intentos. Espera un momento e intenta de nuevo.",
  500: "Error del servidor. Intenta más tarde.",
};

export default function VerifyCodePage() {
  return (
    <Suspense>
      <VerifyCodeContent />
    </Suspense>
  );
}

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      router.replace("/forgot-password");
    }
  }, [email, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/account-recovery/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!res.ok) {
        const message = ERROR_MESSAGES[res.status] ?? "Ocurrió un error inesperado. Intenta de nuevo.";
        setError(message);
        return;
      }

      router.push(
        `/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`
      );
    } catch {
      setError("No se pudo conectar con el servidor. Verifica tu conexión.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F5F0E8" }}>
      {/* Left — form */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Brand */}
          <div className="mb-10">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#4A7FA5" }}
            >
              NeuroLive
            </span>
            <h1 className="mt-6 text-3xl font-bold text-gray-900 leading-snug">
              Verificar código
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Ingresa el código de 6 dígitos que enviamos a tu correo.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Code */}
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Código de verificación
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={isLoading}
                maxLength={6}
                placeholder="000000"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition disabled:opacity-50 tracking-widest text-center text-lg font-semibold"
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4A7FA5")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "")}
              />
            </div>

            {/* Error message */}
            {error && (
              <p
                role="alert"
                className="rounded-lg px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: "#4A7FA5" }}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Verificando...
                </>
              ) : (
                "Verificar código"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            ¿No recibiste el código?{" "}
            <Link
              href="/forgot-password"
              className="font-medium transition hover:opacity-75"
              style={{ color: "#4A7FA5" }}
            >
              Solicitar de nuevo
            </Link>
          </p>
        </div>
      </div>

      {/* Right — decorative panel */}
      <div
        className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ backgroundColor: "#D6E8F5" }}
        aria-hidden="true"
      >
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30"
          style={{ backgroundColor: "#4A7FA5" }}
        />
        <div
          className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-20"
          style={{ backgroundColor: "#4A7FA5" }}
        />

        <div className="relative z-10 text-center max-w-xs">
          <div
            className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg"
            style={{ backgroundColor: "#4A7FA5" }}
          >
            <BrainIcon />
          </div>
          <h2 className="text-2xl font-bold leading-snug" style={{ color: "#1e3a4f" }}>
            Monitoreo cognitivo
            <br />
            en tiempo real
          </h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "#2d5a7a" }}>
            Acompañamos a personas neurodivergentes y sus cuidadores con datos claros y apoyo continuo.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {[
              "Métricas biométricas en tiempo real",
              "Alertas tempranas de riesgo",
              "Panel para médicos y cuidadores",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium"
                style={{ backgroundColor: "rgba(255,255,255,0.55)", color: "#1e3a4f" }}
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: "#4A7FA5" }}
                />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-10"
      fill="none"
      viewBox="0 0 24 24"
      stroke="white"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 3A5.25 5.25 0 004.5 8.25c0 1.01.285 1.955.782 2.756A4.501 4.501 0 007.5 19.5h9a4.5 4.5 0 002.218-8.494A5.25 5.25 0 0014.25 3 5.227 5.227 0 0012 3.44 5.227 5.227 0 009.75 3z"
      />
    </svg>
  );
}
