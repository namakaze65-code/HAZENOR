import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || "http://127.0.0.1:8000/api/v1";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_API_URL}/auth/register`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return NextResponse.json(data, { status: res.status });
    }

    const cookieStore = await cookies();
    const token: string | undefined = data.data?.token;
    const defaultOrgId: string | undefined = data.data?.active_organization?.id;

    if (token) {
      cookieStore.set("ruko360_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    if (defaultOrgId) {
      cookieStore.set("ruko360_org_id", defaultOrgId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    // A newly registered account always owns its own organization -> Portal Pemilik
    cookieStore.set("ruko360_portal", "owner", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Never expose the API token to browser JavaScript; it lives only in the httpOnly cookie
    if (data.data) {
      delete data.data.token;
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghubungi server registrasi HAZENOR Properties.",
      },
      { status: 502 }
    );
  }
}
