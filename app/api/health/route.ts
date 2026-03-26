import { NextResponse } from "next/server";
import { getBackendHealth } from "@/lib/api";

export async function GET() {
  const health = await getBackendHealth();

  return NextResponse.json(health, {
    status: health.label === "Connected" ? 200 : 503
  });
}
