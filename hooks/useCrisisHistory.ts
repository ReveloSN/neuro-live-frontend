"use client";

import { useState, useEffect } from "react";

const BACKEND_URL = "https://neurolive-backend.azurewebsites.net";

export interface CrisisEvent {
  id: string;
  date: string;
  duration: string;
  interventionType: string;
  valence: number;
  arousal: number;
}

interface UseCrisisHistoryResult {
  events: CrisisEvent[];
  loading: boolean;
  error: string | null;
}

function formatDate(raw: unknown): string {
  if (!raw) return "—";
  const d = new Date(String(raw));
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function formatDuration(raw: unknown): string {
  if (raw == null) return "—";
  if (typeof raw === "string" && !/^\d+$/.test(raw)) return raw;
  const secs = Number(raw);
  if (isNaN(secs)) return String(raw);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}

export function useCrisisHistory(
  patientId: number | null,
  userToken?: string
): UseCrisisHistoryResult {
  const [events, setEvents] = useState<CrisisEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId || !userToken) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${BACKEND_URL}/crises/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    })
      .then(async (res) => {
        if (res.status === 404) return { list: [], error: null };
        if (res.status === 403) return { list: [], error: "No tienes acceso al historial de este paciente" };
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        const list: unknown[] = Array.isArray(data)
          ? data
          : Array.isArray((data as { content?: unknown[] }).content)
          ? (data as { content: unknown[] }).content
          : [];
        return { list, error: null };
      })
      .then(({ list, error: fetchError }: { list: unknown[]; error: string | null }) => {
        if (cancelled) return;
        if (fetchError) {
          setError(fetchError);
          setEvents([]);
          setLoading(false);
          return;
        }
        const mapped: CrisisEvent[] = list.map((item, idx) => {
          const e = item as Record<string, unknown>;
          return {
            id: String(e.id ?? idx),
            date: formatDate(e.startedAt),
            duration: formatDuration(e.durationSeconds),
            interventionType: String(e.interventionType ?? "—"),
            valence: Math.min(5, Math.max(1, Number(e.samValence ?? 3))),
            arousal: Math.min(5, Math.max(1, Number(e.samArousal ?? 3))),
          };
        });
        setEvents(mapped);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("No se pudo cargar el historial. Intenta de nuevo.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId, userToken]);

  return { events, loading, error };
}
