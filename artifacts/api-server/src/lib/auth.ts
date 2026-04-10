import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env["SESSION_SECRET"];
if (!JWT_SECRET && process.env["NODE_ENV"] === "production") {
  throw new Error("SESSION_SECRET environment variable must be set in production");
}
const EFFECTIVE_SECRET = JWT_SECRET || "golf-charity-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: number; role: string }): string {
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const decoded = jwt.verify(token, EFFECTIVE_SECRET) as { userId: number; role: string };
    return decoded;
  } catch {
    return null;
  }
}
