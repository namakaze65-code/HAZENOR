import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || "http://127.0.0.1:8000/api/v1";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ruko360_token")?.value;

  if (token) {
    try {
      await fetch(`${BACKEND_API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore upstream network error during logout cleanup
    }
  }

  cookieStore.delete("ruko360_token");
  cookieStore.delete("ruko360_org_id");
  cookieStore.delete("ruko360_portal");
  cookieStore.delete("ruko360_super_admin");

  return NextResponse.json({
    success: true,
    message: "Berhasil keluar dari sesi.",
    data: null,
  });
}
