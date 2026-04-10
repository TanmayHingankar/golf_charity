import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, subscriptionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { hashPassword, comparePassword, signToken } from "../lib/auth.js";
import { authenticate, type AuthRequest } from "../middlewares/authenticate.js";
import { sendWelcomeEmail } from "../lib/email.js";

async function getSubscriptionStatus(userId: number): Promise<string | null> {
  const [sub] = await db.select().from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);
  if (!sub) return null;
  const now = new Date();
  if (sub.status === "active" && sub.renewalDate && sub.renewalDate < now) {
    await db.update(subscriptionsTable)
      .set({ status: "expired" })
      .where(eq(subscriptionsTable.id, sub.id));
    return "expired";
  }
  return sub.status;
}

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, charityId, charityPercentage } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "BadRequest", message: "Name, email, and password are required" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "BadRequest", message: "Password must be at least 8 characters" });
      return;
    }

    if (charityPercentage !== undefined && (charityPercentage < 10 || charityPercentage > 100)) {
      res.status(400).json({ error: "BadRequest", message: "Charity percentage must be between 10 and 100" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Conflict", message: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      name,
      email,
      passwordHash,
      charityId: charityId || null,
      charityPercentage: charityPercentage || 10,
    }).returning();

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(user.email, user.name);

    const token = signToken({ userId: user.id, role: user.role });
    const subscriptionStatus = await getSubscriptionStatus(user.id);

    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env["NODE_ENV"] === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    };

    res.cookie("session_token", token, cookieOptions);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        charityId: user.charityId,
        charityPercentage: user.charityPercentage,
        subscriptionStatus,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "Error registering user");
    res.status(500).json({ error: "InternalServerError", message: "Failed to register user" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "BadRequest", message: "Email and password are required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role });
    const subscriptionStatus = await getSubscriptionStatus(user.id);

    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env["NODE_ENV"] === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };

    res.cookie("session_token", token, cookieOptions);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        charityId: user.charityId,
        charityPercentage: user.charityPercentage,
        subscriptionStatus,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "Error logging in");
    res.status(500).json({ error: "InternalServerError", message: "Failed to login" });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.clearCookie("session_token", { path: "/" });
  res.json({ message: "Logged out successfully" });
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "User not found" });
      return;
    }

    const subscriptionStatus = await getSubscriptionStatus(user.id);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      charityId: user.charityId,
      charityPercentage: user.charityPercentage,
      subscriptionStatus,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting current user");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get user" });
  }
});

export default router;
