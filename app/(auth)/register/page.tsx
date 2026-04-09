"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserRole, RegisterRequest, RegisterResponse } from "@/lib/types";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://neurolive-backend.azurewebsites.net").replace(/\/$/, "");

const ROLES: { label: string; value: UserRole }[] = [
  { label: "Paciente", value: "PATIENT" },
  { label: "Cuidador", value: "CAREGIVER" },
  { label: "Médico", value: "DOCTOR" },
  { label: "Usuario Personal", value: "USER_PERSONAL" },
];

const ERROR_MESSAGES: Record<number, string> = {
  400: "Los datos ingresados no son válidos. Revisa el formulario.",
  409: "Ya existe una cuenta con ese correo electrónico.",
  429: "Demasiados intentos. Espera un momento e intenta de nuevo.",
  500: "Error del servidor. Intenta más tarde.",
};

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("PATIENT");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      const body: RegisterRequest = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      };

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const message = ERROR_MESSAGES[res.status] ?? "Ocurrió un error inesperado. Intenta de nuevo.";
        setError(message);
        return;
      }

      const data: RegisterResponse = await res.json();
      void data;

      router.push("/login?registered=true");
    } catch {
      setError("No se pudo conectar con el servidor. Verifica tu conexión.");
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = name && email && password && confirmPassword && !isLoading;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F5F0E8" }}>
      {/* Left — registration form */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Brand */}
          <div className="mb-8">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#4A7FA5" }}
            >
              NeuroLive
            </span>
            <h1 className="mt-6 text-3xl font-bold text-gray-900 leading-snug">
              Crear cuenta
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Completa tus datos para comenzar.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Full name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre completo
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                maxLength={100}
                placeholder="Tu nombre"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition disabled:opacity-50"
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4A7FA5")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "")}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                maxLength={150}
                placeholder="tu@correo.com"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition disabled:opacity-50"
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4A7FA5")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "")}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                maxLength={50}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition disabled:opacity-50"
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4A7FA5")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "")}
              />
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                maxLength={50}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition disabled:opacity-50"
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4A7FA5")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "")}
              />
            </div>

            {/* Role selector */}
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de perfil
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(({ label, value }) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium cursor-pointer transition"
                    style={{
                      borderColor: role === value ? "#4A7FA5" : "#D1D5DB",
                      backgroundColor: role === value ? "#EBF4FA" : "white",
                      color: role === value ? "#4A7FA5" : "#374151",
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={role === value}
                      onChange={() => setRole(value)}
                      disabled={isLoading}
                      className="sr-only"
                    />
                    <span
                      className="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: role === value ? "#4A7FA5" : "#9CA3AF",
                      }}
                    >
                      {role === value && (
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: "#4A7FA5" }}
                        />
                      )}
                    </span>
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

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
              disabled={!canSubmit}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: "#4A7FA5" }}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Creando cuenta...
                </>
              ) : (
                "Crear mi cuenta"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-medium transition hover:opacity-75"
              style={{ color: "#4A7FA5" }}
            >
              Inicia sesión
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
        {/* Soft background circles */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30"
          style={{ backgroundColor: "#4A7FA5" }}
        />
        <div
          className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-20"
          style={{ backgroundColor: "#4A7FA5" }}
        />

        {/* Content */}
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

          {/* Feature pills */}
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
