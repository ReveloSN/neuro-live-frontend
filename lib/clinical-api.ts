import { getApiBaseUrl } from "@/lib/api";
import type {
  BiometricTelemetrySampleResponse,
  ClinicalAnalysisResponse,
  CrisisEventResponse,
  DeviceResponse,
  PageResponse,
  UserLinkResponse,
  UserProfileResponse,
} from "@/lib/types";

export class NeuroLiveApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly path: string,
  ) {
    super(message);
    this.name = "NeuroLiveApiError";
  }
}

async function readErrorMessage(response: Response) {
  try {
    const body = await response.json();
    if (typeof body?.message === "string") return body.message;
    if (typeof body?.detail === "string") return body.detail;
    if (typeof body?.error === "string") return body.error;
  } catch {
    // Si el backend no responde JSON, conservamos un mensaje HTTP simple.
  }

  return `Backend responded with HTTP ${response.status}`;
}

export async function backendGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new NeuroLiveApiError(await readErrorMessage(response), response.status, path);
  }

  return response.json() as Promise<T>;
}

export function getCurrentUserProfile(token: string) {
  return backendGet<UserProfileResponse>("/users/me", token);
}

export function getMyLinks(token: string) {
  return backendGet<UserLinkResponse[]>("/links/me", token);
}

export function getPatientDevices(token: string, patientId: number) {
  return backendGet<DeviceResponse[]>(`/devices/patients/${patientId}`, token);
}

export function getLatestTelemetry(token: string, patientId: number) {
  return backendGet<BiometricTelemetrySampleResponse>(`/biometrics/patients/${patientId}/telemetry/latest`, token);
}

export function getPatientAnalysis(token: string, patientId: number) {
  return backendGet<ClinicalAnalysisResponse>(`/crises/patients/${patientId}/analysis`, token);
}

export function getPatientCrises(token: string, patientId: number, size = 10) {
  return backendGet<PageResponse<CrisisEventResponse>>(`/crises/patients/${patientId}?page=0&size=${size}`, token);
}

export async function downloadPatientCrisesCsv(
  token: string,
  patientId: number,
  options?: {
    start?: string;
    end?: string;
  },
): Promise<{ blob: Blob; filename: string }> {
  const searchParams = new URLSearchParams();
  if (options?.start) searchParams.set("start", options.start);
  if (options?.end) searchParams.set("end", options.end);

  const path = `/crises/patients/${patientId}/export${searchParams.size ? `?${searchParams.toString()}` : ""}`;
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "text/csv",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new NeuroLiveApiError(await readErrorMessage(response), response.status, path);
  }

  return {
    blob: await response.blob(),
    filename: extractFilenameFromContentDisposition(response.headers.get("Content-Disposition"))
      ?? `crisis-events-${patientId}.csv`,
  };
}

function extractFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const filenameMatch = /filename="?([^";]+)"?/i.exec(header);
  return filenameMatch?.[1]?.trim() || null;
}

export function triggerCsvDownload(blob: Blob, filename: string): void {
  // Descarga el CSV generado por el backend sin exponer datos en la URL.
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function optionalBackendGet<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof NeuroLiveApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
