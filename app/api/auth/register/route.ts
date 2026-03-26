import { NextRequest } from "next/server";
import { proxyJsonRequest } from "@/lib/backend-proxy";
import type { RegisterRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RegisterRequest;

  return proxyJsonRequest({
    method: "POST",
    path: "/auth/register",
    body
  });
}
