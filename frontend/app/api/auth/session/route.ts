import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Returns which portal the current session belongs to (no secrets exposed). */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ruko360_token")?.value;

  return NextResponse.json({
    success: true,
    data: {
      authenticated: Boolean(token),
      portal: token ? cookieStore.get("ruko360_portal")?.value || "owner" : null,
      is_super_admin: token ? cookieStore.get("ruko360_super_admin")?.value === "1" : false,
    },
  });
}
