import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE_NAME = "ncc_admin_session";
const SESSION_DURATION = "12h";

function getSecretKey() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Bcrypt hashes contain literal "$" characters, which several env var
 * systems (including, inconsistently, Next.js's own dotenv-expand env
 * loader) treat as the start of a "$VAR" reference to interpolate — silently
 * corrupting the hash. Storing it base64-encoded sidesteps the whole problem
 * since base64 never contains "$". ADMIN_PASSWORD_HASH (raw) is still
 * supported as a fallback for hosts where this isn't a concern.
 */
export function getAdminPasswordHash(): string | undefined {
  const b64 = process.env.ADMIN_PASSWORD_HASH_BASE64;
  if (b64) {
    return Buffer.from(b64, "base64").toString("utf8");
  }
  return process.env.ADMIN_PASSWORD_HASH;
}
