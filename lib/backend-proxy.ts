import { NextResponse } from "next/server";
import { normalizeApiUrl } from "@/lib/api";

type ProxyRequestOptions = {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};

function getBackendBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  return apiUrl ? normalizeApiUrl(apiUrl) : null;
}

export async function proxyJsonRequest({
  method,
  path,
  body,
  headers
}: ProxyRequestOptions) {
  const backendBaseUrl = getBackendBaseUrl();

  if (!backendBaseUrl) {
    return NextResponse.json(
      {
        message:
          "Backend not configured yet. Add NEXT_PUBLIC_API_URL to enable server-side proxy routes."
      },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(`${backendBaseUrl}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store"
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        message:
          "The frontend proxy could not reach the backend. Verify the deployment URL and backend availability."
      },
      { status: 503 }
    );
  }
}
