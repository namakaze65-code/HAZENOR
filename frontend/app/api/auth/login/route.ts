import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || "http://127.0.0.1:8000/api/v1";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_API_URL}/auth/login`, {
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
    const defaultOrgId: string | undefined =
      data.data?.active_organization?.id || data.data?.organizations?.[0]?.id;

    if (token) {
      cookieStore.set("ruko360_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
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

    // Portal the account belongs to (owner | tenant | super-admin). Used by middleware.ts
    // to keep users inside their own portal. Real authorization is enforced by the API.
    const portal: string = data.data?.portal || "owner";
    cookieStore.set("ruko360_portal", portal, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set("ruko360_super_admin", data.data?.is_super_admin ? "1" : "0", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      message: data.message,
      data: {
        user: data.data?.user,
        portal,
        is_super_admin: Boolean(data.data?.is_super_admin),
        active_organization: data.data?.active_organization,
        organizations: data.data?.organizations,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghubungi server autentikasi HAZENOR Properties.",
      },
      { status: 502 }
    );
  }
}
