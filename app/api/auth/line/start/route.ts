import crypto from "node:crypto";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!channelId || !appUrl) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า LINE_LOGIN_CHANNEL_ID หรือ NEXT_PUBLIC_APP_URL" },
      { status: 500 },
    );
  }

  const state = crypto.randomBytes(24).toString("hex");
  const nonce = crypto.randomBytes(24).toString("hex");
  const redirectUri = `${appUrl.replace(/\/$/, "")}/api/auth/line/callback`;
  const url = new URL("https://access.line.me/oauth2/v2.1/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", channelId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "profile openid");
  url.searchParams.set("nonce", nonce);

  const response = NextResponse.redirect(url);
  response.cookies.set("line_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  response.cookies.set("line_oauth_nonce", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return response;
}
