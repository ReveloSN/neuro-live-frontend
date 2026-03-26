type HealthTone = "normal" | "elevated" | "neutral";

type BackendHealthState = {
  apiUrl: string | null;
  description: string;
  label: string;
  tone: HealthTone;
};

export function normalizeApiUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export async function getBackendHealth(): Promise<BackendHealthState> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    return {
      apiUrl: null,
      description: "Backend not configured yet. Add NEXT_PUBLIC_API_URL to enable the health check.",
      label: "Not configured",
      tone: "neutral"
    };
  }

  const healthUrl = `${normalizeApiUrl(apiUrl)}/health`;

  try {
    const response = await fetch(healthUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return {
        apiUrl,
        description: `Health check responded with HTTP ${response.status}. The frontend is ready, but the backend needs attention.`,
        label: "Unavailable",
        tone: "elevated"
      };
    }

    return {
      apiUrl,
      description: "Backend connectivity looks healthy and the integration endpoint responded successfully.",
      label: "Connected",
      tone: "normal"
    };
  } catch {
    return {
      apiUrl,
      description:
        "Health check could not reach the backend. Verify the URL, deployment status, and CORS or network configuration.",
      label: "Unavailable",
      tone: "elevated"
    };
  }
}
