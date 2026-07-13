import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signSession } from "@/lib/auth/session";

function fail(request: NextRequest, message: string) {
  return NextResponse.redirect(
    new URL(`/admin/login?error=${encodeURIComponent(message)}`, request.url),
  );
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("line_oauth_state")?.value;
  const nonce = request.cookies.get("line_oauth_nonce")?.value;
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!code || !state || !storedState || state !== storedState || !nonce) {
    return fail(request, "การยืนยันตัวตนไม่ถูกต้อง กรุณาลองใหม่");
  }
  if (!channelId || !channelSecret || !appUrl) {
    return fail(request, "ยังตั้งค่า LINE Login ไม่ครบ");
  }

  const redirectUri = `${appUrl.replace(/\/$/, "")}/api/auth/line/callback`;
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: channelId,
    client_secret: channelSecret,
  });

  const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody,
    cache: "no-store",
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.id_token) {
    return fail(request, "LINE Login ไม่สำเร็จ");
  }

  const verifyResponse = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id_token: token.id_token,
      client_id: channelId,
      nonce,
    }),
    cache: "no-store",
  });
  const identity = await verifyResponse.json();
  if (!verifyResponse.ok || !identity.sub) {
    return fail(request, "ตรวจสอบ LINE ID ไม่สำเร็จ");
  }

  const supabase = createAdminClient();
  let { data: profile } = await supabase
    .from("profiles")
    .select("id, role, approval_status, is_active")
    .eq("line_user_id", identity.sub)
    .maybeSingle();

  const bootstrap = process.env.SUPER_ADMIN_BOOTSTRAP === "true";
  if (!profile && bootstrap) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");

    if ((count ?? 0) === 0) {
      const created = await supabase
        .from("profiles")
        .insert({
          line_user_id: identity.sub,
          line_display_name: identity.name ?? "Super Admin",
          line_picture_url: identity.picture ?? null,
          full_name: identity.name ?? "Super Admin",
          phone: "-",
          role: "super_admin",
          approval_status: "approved",
          is_active: true,
        })
        .select("id, role, approval_status, is_active")
        .single();
      profile = created.data;
    }
  }

  if (!profile) return fail(request, "บัญชีนี้ยังไม่ได้รับสิทธิ์แอดมิน");
  if (!profile.is_active || profile.approval_status !== "approved") {
    return fail(request, "บัญชีนี้ยังไม่ได้รับอนุมัติหรือถูกระงับ");
  }
  if (!["admin", "super_admin"].includes(profile.role)) {
    return fail(request, "บัญชีนี้ไม่ใช่แอดมิน");
  }

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: "admin_line_login",
    entity_type: "profile",
    entity_id: profile.id,
    new_data: { line_user_id: identity.sub },
  });

  const session = signSession({
    profileId: profile.id,
    lineUserId: identity.sub,
    role: profile.role,
  });

  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.cookies.set("admin_session", session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  response.cookies.delete("line_oauth_state");
  response.cookies.delete("line_oauth_nonce");
  return response;
}
