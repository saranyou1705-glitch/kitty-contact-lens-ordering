import crypto from "node:crypto";

export type AdminSession = {
  profileId: string;
  lineUserId: string;
  role: "admin" | "super_admin";
  exp: number;
};

function secret() {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value) throw new Error("Missing AUTH_SESSION_SECRET");
  return value;
}

export function signSession(payload: Omit<AdminSession, "exp">) {
  const session: AdminSession = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
  };
  const encoded = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySession(token?: string | null): AdminSession | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = crypto
    .createHmac("sha256", secret())
    .update(encoded)
    .digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as AdminSession;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    if (!["admin", "super_admin"].includes(session.role)) return null;
    return session;
  } catch {
    return null;
  }
}
