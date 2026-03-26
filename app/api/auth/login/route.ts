import { NextRequest } from "next/server";
import { proxyJsonRequest } from "@/lib/backend-proxy";
import type { LoginRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginRequest;

  return proxyJsonRequest({
    method: "POST",
    path: "/auth/login",
    body
  });
}
