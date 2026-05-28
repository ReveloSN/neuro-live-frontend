"use client";

import { useState, useEffect } from "react";

const BACKEND_URL = "https://neurolive-backend.azurewebsites.net";

export interface LinkedPatient {
  id: number;
  patientId: number;
  linkType: string;
}

interface UseLinkedPatientsResult {
  patients: LinkedPatient[];
  loading: boolean;
  error: string | null;
}

export function useLinkedPatients(userToken: string, _role: string): UseLinkedPatientsResult {
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${BACKEND_URL}/links/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((data: unknown) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        const active: LinkedPatient[] = list
          .filter((link) => link != null && link.status === "ACTIVE")
          .map((link) => ({
            id: link.id as number,
            patientId: link.patientId as number,
            linkType: link.linkType as string,
          }));
        setPatients(active);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("No se pudieron cargar los pacientes. Intenta de nuevo.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userToken]);

  return { patients, loading, error };
}
