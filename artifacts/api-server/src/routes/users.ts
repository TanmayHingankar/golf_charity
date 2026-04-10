import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, subscriptionsTable, scoresTable } from "@workspace/db";
import { eq, ilike, or, sql, desc, inArray } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/authenticate.js";

async function getSubscriptionStatusMap(userIds: number[]): Promise<Map<number, string | null>> {
  if (userIds.length === 0) return new Map();
  const subs = await db.select({ userId: subscriptionsTable.userId, status: subscriptionsTable.status })
    .from(subscriptionsTable)
    .where(inArray(subscriptionsTable.userId, userIds));

  const map = new Map<number, string | null>();
  for (const sub of subs) {
    if (!map.has(sub.userId)) map.set(sub.userId, sub.status);
  }
  return map;
}

async function getSingleSubscriptionStatus(userId: number): Promise<string | null> {
  const [sub] = await db.select({ status: subscriptionsTable.status })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);
  return sub?.status || null;
}

const router = Router();

// GET /api/users — list all users (admin)
router.get("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 20;
    const search = req.query["search"] as string | undefined;
    const offset = (page - 1) * limit;

    const conditions = search
      ? or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`))
      : undefined;

    const [users, countResult] = await Promise.all([
      db.select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        charityId: usersTable.charityId,
        charityPercentage: usersTable.charityPercentage,
        createdAt: usersTable.createdAt,
      }).from(usersTable).where(conditions).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(conditions),
    ]);

    const userIds = users.map(u => u.id);
    const statusMap = await getSubscriptionStatusMap(userIds);

    res.json({
      users: users.map(u => ({ ...u, subscriptionStatus: statusMap.get(u.id) ?? null })),
      total: countResult[0]?.count || 0,
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Error listing users");
    res.status(500).json({ error: "InternalServerError", message: "Failed to list users" });
  }
});

// GET /api/users/:userId
router.get("/:userId", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params["userId"]!);
    if (req.userRole !== "admin" && req.userId !== userId) {
      res.status(403).json({ error: "Forbidden", message: "Access denied" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "NotFound", message: "User not found" });
      return;
    }

    const subscriptionStatus = await getSingleSubscriptionStatus(userId);

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
    req.log.error({ err }, "Error getting user");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get user" });
  }
});

// PATCH /api/users/:userId
router.patch("/:userId", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params["userId"]!);
    if (req.userRole !== "admin" && req.userId !== userId) {
      res.status(403).json({ error: "Forbidden", message: "Access denied" });
      return;
    }

    const { name, email, charityId, charityPercentage } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates["name"] = name;
    if (email !== undefined) updates["email"] = email;
    if (charityId !== undefined) updates["charityId"] = charityId;
    if (charityPercentage !== undefined) {
      if (charityPercentage < 10 || charityPercentage > 100) {
        res.status(400).json({ error: "BadRequest", message: "Charity percentage must be between 10 and 100" });
        return;
      }
      updates["charityPercentage"] = charityPercentage;
    }

    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
    if (!updated) {
      res.status(404).json({ error: "NotFound", message: "User not found" });
      return;
    }

    const subscriptionStatus = await getSingleSubscriptionStatus(userId);

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      charityId: updated.charityId,
      charityPercentage: updated.charityPercentage,
      subscriptionStatus,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Error updating user");
    res.status(500).json({ error: "InternalServerError", message: "Failed to update user" });
  }
});

// GET /api/users/:userId/scores — admin: view user's scores
router.get("/:userId/scores", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params["userId"]!);
    const scores = await db.select().from(scoresTable)
      .where(eq(scoresTable.userId, userId))
      .orderBy(desc(scoresTable.playedAt));

    res.json(scores);
  } catch (err) {
    req.log.error({ err }, "Error getting user scores");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get scores" });
  }
});

// PATCH /api/users/:userId/scores/:scoreId — admin: edit a user's score
router.patch("/:userId/scores/:scoreId", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params["userId"]!);
    const scoreId = parseInt(req.params["scoreId"]!);
    const { value, playedAt } = req.body;

    if (value !== undefined && (value < 1 || value > 45)) {
      res.status(400).json({ error: "BadRequest", message: "Score must be between 1 and 45" });
      return;
    }

    if (playedAt !== undefined) {
      const date = new Date(playedAt);
      if (isNaN(date.getTime())) {
        res.status(400).json({ error: "BadRequest", message: "Invalid date format" });
        return;
      }
      if (date > new Date()) {
        res.status(400).json({ error: "BadRequest", message: "Score date cannot be in the future" });
        return;
      }
    }

    const updates: Record<string, unknown> = {};
    if (value !== undefined) updates["value"] = value;
    if (playedAt !== undefined) updates["playedAt"] = new Date(playedAt);

    const [updated] = await db.update(scoresTable)
      .set(updates)
      .where(eq(scoresTable.id, scoreId))
      .returning();

    if (!updated || updated.userId !== userId) {
      res.status(404).json({ error: "NotFound", message: "Score not found" });
      return;
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error updating score");
    res.status(500).json({ error: "InternalServerError", message: "Failed to update score" });
  }
});

// DELETE /api/users/:userId/scores/:scoreId — admin: delete a user's score
router.delete("/:userId/scores/:scoreId", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params["userId"]!);
    const scoreId = parseInt(req.params["scoreId"]!);

    const [deleted] = await db.delete(scoresTable)
      .where(eq(scoresTable.id, scoreId))
      .returning();

    if (!deleted || deleted.userId !== userId) {
      res.status(404).json({ error: "NotFound", message: "Score not found" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting score");
    res.status(500).json({ error: "InternalServerError", message: "Failed to delete score" });
  }
});

export default router;
