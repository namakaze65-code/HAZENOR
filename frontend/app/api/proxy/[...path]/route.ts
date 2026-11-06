import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || "http://127.0.0.1:8000/api/v1";

async function forwardRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("ruko360_token")?.value;
  const orgId =
    request.headers.get("X-Organization-Id") ||
    cookieStore.get("ruko360_org_id")?.value;

  const targetUrl = new URL(`${BACKEND_API_URL}/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((val, key) => {
    targetUrl.searchParams.set(key, val);
  });

  const headers = new Headers();
  headers.set("Accept", "application/json");
  const contentType = request.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (orgId) {
    headers.set("X-Organization-Id", orgId);
  }
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined;

  const res = await fetch(targetUrl.toString(), {
    method: request.method,
    headers,
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export const GET = forwardRequest;
export const POST = forwardRequest;
export const PUT = forwardRequest;
export const PATCH = forwardRequest;
export const DELETE = forwardRequest;
