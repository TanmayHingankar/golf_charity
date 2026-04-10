import { Router } from "express";
import { db } from "@workspace/db";
import { scoresTable } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/authenticate.js";
import { MAX_SCORES_PER_USER } from "@workspace/db";

const router = Router();

// GET /api/scores/my
router.get("/my", authenticate, async (req: AuthRequest, res) => {
  try {
    const scores = await db.select().from(scoresTable)
      .where(eq(scoresTable.userId, req.userId!))
      .orderBy(desc(scoresTable.playedAt));
    res.json(scores);
  } catch (err) {
    req.log.error({ err }, "Error getting scores");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get scores" });
  }
});

// POST /api/scores
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { value, playedAt } = req.body;

    if (!value || value < 1 || value > 45) {
      res.status(400).json({ error: "BadRequest", message: "Score value must be between 1 and 45" });
      return;
    }

    if (!playedAt) {
      res.status(400).json({ error: "BadRequest", message: "playedAt date is required" });
      return;
    }

    const scoreDate = new Date(playedAt);
    if (isNaN(scoreDate.getTime())) {
      res.status(400).json({ error: "BadRequest", message: "Invalid date format" });
      return;
    }
    if (scoreDate > new Date()) {
      res.status(400).json({ error: "BadRequest", message: "Score date cannot be in the future" });
      return;
    }

    const existing = await db.select().from(scoresTable)
      .where(eq(scoresTable.userId, req.userId!))
      .orderBy(asc(scoresTable.playedAt));

    // Reject duplicate score for same day/value to avoid duplicates
    const duplicate = existing.find(s => {
      const sameDay = new Date(s.playedAt).toDateString() === scoreDate.toDateString();
      return sameDay && s.value === value;
    });
    if (duplicate) {
      res.status(409).json({ error: "Conflict", message: "Duplicate score for the same day already exists" });
      return;
    }

    // Rolling 5 — if at max, delete oldest first

    if (existing.length >= MAX_SCORES_PER_USER) {
      const oldest = existing[0]!;
      await db.delete(scoresTable).where(eq(scoresTable.id, oldest.id));
    }

    await db.insert(scoresTable).values({
      userId: req.userId!,
      value,
      playedAt: new Date(playedAt),
    });

    const updated = await db.select().from(scoresTable)
      .where(eq(scoresTable.userId, req.userId!))
      .orderBy(desc(scoresTable.playedAt));

    res.status(201).json(updated);
  } catch (err) {
    req.log.error({ err }, "Error adding score");
    res.status(500).json({ error: "InternalServerError", message: "Failed to add score" });
  }
});

// PATCH /api/scores/:scoreId
router.patch("/:scoreId", authenticate, async (req: AuthRequest, res) => {
  try {
    const scoreId = parseInt(req.params["scoreId"]!);
    const { value, playedAt } = req.body;

    const [score] = await db.select().from(scoresTable).where(eq(scoresTable.id, scoreId)).limit(1);
    if (!score) {
      res.status(404).json({ error: "NotFound", message: "Score not found" });
      return;
    }

    if (req.userRole !== "admin" && score.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden", message: "Access denied" });
      return;
    }

    if (value !== undefined && (typeof value !== "number" || value < 1 || value > 45)) {
      res.status(400).json({ error: "BadRequest", message: "Score value must be a number between 1 and 45" });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (value !== undefined) updates["value"] = value;
    if (playedAt !== undefined) updates["playedAt"] = new Date(playedAt);

    const [updated] = await db.update(scoresTable).set(updates).where(eq(scoresTable.id, scoreId)).returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error updating score");
    res.status(500).json({ error: "InternalServerError", message: "Failed to update score" });
  }
});

// DELETE /api/scores/:scoreId
router.delete("/:scoreId", authenticate, async (req: AuthRequest, res) => {
  try {
    const scoreId = parseInt(req.params["scoreId"]!);

    const [score] = await db.select().from(scoresTable).where(eq(scoresTable.id, scoreId)).limit(1);
    if (!score) {
      res.status(404).json({ error: "NotFound", message: "Score not found" });
      return;
    }

    if (req.userRole !== "admin" && score.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden", message: "Access denied" });
      return;
    }

    await db.delete(scoresTable).where(eq(scoresTable.id, scoreId));
    res.json({ message: "Score deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Error deleting score");
    res.status(500).json({ error: "InternalServerError", message: "Failed to delete score" });
  }
});

// GET /api/scores/user/:userId — admin
router.get("/user/:userId", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params["userId"]!);
    const scores = await db.select().from(scoresTable)
      .where(eq(scoresTable.userId, userId))
      .orderBy(desc(scoresTable.playedAt));
    res.json(scores);
  } catch (err) {
    req.log.error({ err }, "Error getting user scores");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get user scores" });
  }
});

export default router;
