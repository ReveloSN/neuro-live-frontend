"use client";

import { useEffect, useState } from "react";
import { NeuroLiveApiError, getPatientCrises } from "@/lib/clinical-api";

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
  if (!raw) return "-";
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) return String(raw);
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function formatDuration(raw: unknown): string {
  if (raw == null) return "-";
  if (typeof raw === "string" && !/^\d+$/.test(raw)) return raw;
  const seconds = Number(raw);
  if (Number.isNaN(seconds)) return String(raw);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes} min ${rest} s` : `${rest} s`;
}

function clampSam(raw: unknown): number {
  const value = Number(raw ?? 3);
  if (Number.isNaN(value)) return 3;
  return Math.min(5, Math.max(1, value));
}

export function useCrisisHistory(patientId: number | null, userToken?: string): UseCrisisHistoryResult {
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
    const token = userToken;
    const resolvedPatientId = patientId;

    async function loadCrisisHistory() {
      setLoading(true);
      setError(null);

      try {
        const page = await getPatientCrises(token, resolvedPatientId, 20);
        if (cancelled) return;
        setEvents(
          (page.content ?? []).map((event) => ({
            id: String(event.id),
            date: formatDate(event.startedAt),
            duration: formatDuration(event.durationSeconds),
            interventionType: event.interventionType ?? "-",
            valence: clampSam(event.samValence),
            arousal: clampSam(event.samArousal),
          })),
        );
      } catch (caught) {
        if (cancelled) return;
        setEvents([]);
        if (caught instanceof NeuroLiveApiError && caught.status === 404) return;
        if (caught instanceof NeuroLiveApiError && caught.status === 403) {
          setError("No tienes acceso al historial de este paciente");
          return;
        }
        setError("No se pudo cargar el historial. Intenta de nuevo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCrisisHistory();

    return () => {
      cancelled = true;
    };
  }, [patientId, userToken]);

  return { events, loading, error };
}
