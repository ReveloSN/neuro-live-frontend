import { NextRequest } from "next/server";
import { proxyJsonRequest } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  return proxyJsonRequest({
    method: "GET",
    path: "/users/me",
    headers: authorization ? { Authorization: authorization } : undefined
  });
}
