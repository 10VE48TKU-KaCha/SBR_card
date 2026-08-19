import crypto from "node:crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

const SESSION_COOKIE_NAME = "customer_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds
const AUTH_SECRET = process.env.AUTH_SECRET || "supapburut_secret_customer_session_token_key_2026";

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  role: Role;
  createdAt: Date;
}

/**
 * Hashes a plaintext password using PBKDF2 with a random 16-byte salt.
 * Output format: "saltHex:hashHex"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against the stored "salt:hash" or handles legacy plain passwords gracefully.
 */
export function verifyPassword(password: string, storedHash: string | null): boolean {
  if (!storedHash) return false;

  // Check if storedHash is in salt:hash format
  if (storedHash.includes(":")) {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const verifyHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  }

  // Fallback for mock/plain seed passwords (e.g. demo tokens)
  return storedHash === password || storedHash === `customer_hashed_token`;
}

/**
 * Creates an HMAC signed session token containing userId and issue timestamp.
 * Format: "userId.timestamp.signature"
 */
export function createSessionToken(userId: string): string {
  const timestamp = Date.now().toString();
  const payload = `${userId}.${timestamp}`;
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

/**
 * Verifies the HMAC signature and expiration (30 days) of a session token.
 */
export function verifySessionToken(token: string): { userId: string } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, timestampStr, signature] = parts;
  if (!userId || !timestampStr || !signature) return null;

  const payload = `${userId}.${timestampStr}`;
  const expectedSig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payload)
    .digest("hex");

  try {
    const isSigValid = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSig, "hex")
    );
    if (!isSigValid) return null;

    const timestamp = parseInt(timestampStr, 10);
    const age = Date.now() - timestamp;
    if (isNaN(timestamp) || age > SESSION_MAX_AGE * 1000 || age < 0) {
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}

/**
 * Sets the customer session cookie in Next.js Server Action or Route Handler.
 */
export async function setCustomerSessionCookie(userId: string): Promise<void> {
  const token = createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Clears the customer session cookie.
 */
export async function clearCustomerSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Retrieves the current customer session userId from cookies.
 */
export async function getCurrentCustomerSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySessionToken(sessionCookie.value);
}

/**
 * Fetches the currently authenticated user from the database.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const session = await getCurrentCustomerSession();
    if (!session) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return null;
  }
}
