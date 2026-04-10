import { Router } from "express";
import { db } from "../lib/db";
import { drawsTable, winnersTable, scoresTable, subscriptionsTable, usersTable } from "../lib/db";
import { eq, desc, and } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/authenticate.js";
import { SUBSCRIPTION_PRICES, PRIZE_POOL_PERCENTAGE, PRIZE_POOL_DISTRIBUTION } from "../lib/db";

const router = Router();

function generateRandomNumbers(count: number, min: number, max: number): number[] {
  const numbers: number[] = [];
  while (numbers.length < count) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(n)) numbers.push(n);
  }
  return numbers.sort((a, b) => a - b);
}

function generateAlgorithmicNumbers(
  userScores: { value: number }[],
  count: number
): number[] {
  // Build frequency map of all scores
  const freqMap: Record<number, number> = {};
  for (const s of userScores) {
    freqMap[s.value] = (freqMap[s.value] || 0) + 1;
  }

  // Weight toward most frequent scores
  const weighted: number[] = [];
  for (const [val, freq] of Object.entries(freqMap)) {
    for (let i = 0; i < freq; i++) {
      weighted.push(parseInt(val));
    }
  }

  if (weighted.length < count) {
    return generateRandomNumbers(count, 1, 45);
  }

  // Pick randomly from weighted pool
  const picked: number[] = [];
  const pool = [...weighted];
  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const val = pool[idx]!;
    if (!picked.includes(val)) picked.push(val);
    pool.splice(idx, 1);
  }

  // Fill remaining with random if needed
  while (picked.length < count) {
    const n = Math.floor(Math.random() * 45) + 1;
    if (!picked.includes(n)) picked.push(n);
  }

  return picked.sort((a, b) => a - b);
}

function countMatches(userScores: number[], drawnNumbers: number[]): number {
  return userScores.filter(s => drawnNumbers.includes(s)).length;
}

// GET /api/draws
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    let draws;
    if (status) {
      draws = await db.select().from(drawsTable)
        .where(eq(drawsTable.status, status as "pending" | "simulated" | "published"))
        .orderBy(desc(drawsTable.year), desc(drawsTable.month));
    } else {
      draws = await db.select().from(drawsTable).orderBy(desc(drawsTable.year), desc(drawsTable.month));
    }

    const result = draws.map(d => ({
      ...d,
      drawnNumbers: d.drawnNumbers ? JSON.parse(d.drawnNumbers) : null,
    }));

    res.json(result);
  } catch (err) {
    (req as any).log.error({ err }, "Error listing draws");
    res.status(500).json({ error: "InternalServerError", message: "Failed to list draws" });
  }
});

// GET /api/draws/latest
router.get("/latest", async (req, res) => {
  try {
    const [draw] = await db.select().from(drawsTable)
      .where(eq(drawsTable.status, "published"))
      .orderBy(desc(drawsTable.year), desc(drawsTable.month))
      .limit(1);

    if (!draw) {
      res.status(404).json({ error: "NotFound", message: "No published draw found" });
      return;
    }

    res.json({ ...draw, drawnNumbers: draw.drawnNumbers ? JSON.parse(draw.drawnNumbers) : null });
  } catch (err) {
    (req as any).log.error({ err }, "Error getting latest draw");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get latest draw" });
  }
});

// POST /api/draws — admin
router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { month, year, drawType = "random" } = req.body;

    if (!month || !year || month < 1 || month > 12) {
      res.status(400).json({ error: "BadRequest", message: "Valid month (1-12) and year are required" });
      return;
    }

    // Calculate prize pool from active subscribers
    const activeSubs = await db.select().from(subscriptionsTable)
      .where(eq(subscriptionsTable.status, "active"));

    const totalPool = activeSubs.reduce((sum, s) => sum + s.prizeContribution, 0);

    // Check for jackpot rollover
    const lastDraw = await db.select().from(drawsTable)
      .where(eq(drawsTable.status, "published"))
      .orderBy(desc(drawsTable.year), desc(drawsTable.month))
      .limit(1);

    let jackpotCarryover = 0;
    if (lastDraw.length > 0 && lastDraw[0]!.jackpotRolledOver) {
      jackpotCarryover = lastDraw[0]!.jackpotAmount;
    }

    const jackpotAmount = totalPool * PRIZE_POOL_DISTRIBUTION.five_match + jackpotCarryover;
    const fourMatchAmount = totalPool * PRIZE_POOL_DISTRIBUTION.four_match;
    const threeMatchAmount = totalPool * PRIZE_POOL_DISTRIBUTION.three_match;

    const [draw] = await db.insert(drawsTable).values({
      month,
      year,
      drawType: drawType as "random" | "algorithmic",
      status: "pending",
      totalPrizePool: totalPool,
      jackpotAmount,
      fourMatchAmount,
      threeMatchAmount,
      jackpotRolledOver: false,
      participantCount: activeSubs.length,
    }).returning();

    res.status(201).json({ ...draw, drawnNumbers: null });
  } catch (err) {
    req.log.error({ err }, "Error creating draw");
    res.status(500).json({ error: "InternalServerError", message: "Failed to create draw" });
  }
});

// GET /api/draws/:drawId
router.get("/:drawId", async (req, res) => {
  try {
    const drawId = parseInt(req.params["drawId"]!);
    const [draw] = await db.select().from(drawsTable).where(eq(drawsTable.id, drawId)).limit(1);
    if (!draw) {
      res.status(404).json({ error: "NotFound", message: "Draw not found" });
      return;
    }
    res.json({ ...draw, drawnNumbers: draw.drawnNumbers ? JSON.parse(draw.drawnNumbers) : null });
  } catch (err) {
    (req as any).log.error({ err }, "Error getting draw");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get draw" });
  }
});

// POST /api/draws/:drawId/simulate — admin
router.post("/:drawId/simulate", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const drawId = parseInt(req.params["drawId"]!);
    const [draw] = await db.select().from(drawsTable).where(eq(drawsTable.id, drawId)).limit(1);
    if (!draw) {
      res.status(404).json({ error: "NotFound", message: "Draw not found" });
      return;
    }

    // Get all active subscriber scores
    const activeSubs = await db.select({ userId: subscriptionsTable.userId })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.status, "active"));

    const activeUserIds = activeSubs.map(s => s.userId);

    // Generate drawn numbers
    let drawnNumbers: number[];
    if (draw.drawType === "algorithmic" && activeUserIds.length > 0) {
      const allScores = await db.select({ value: scoresTable.value }).from(scoresTable);
      drawnNumbers = generateAlgorithmicNumbers(allScores, 5);
    } else {
      drawnNumbers = generateRandomNumbers(5, 1, 45);
    }

    // Calculate winners
    const fiveMatchWinners: { userId: number; userName: string; matchedNumbers: number[]; matchCount: number; prizeAmount: number }[] = [];
    const fourMatchWinners: typeof fiveMatchWinners = [];
    const threeMatchWinners: typeof fiveMatchWinners = [];

    for (const userId of activeUserIds) {
      const userScores = await db.select({ value: scoresTable.value })
        .from(scoresTable)
        .where(eq(scoresTable.userId, userId));

      const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      const scoreValues = userScores.map(s => s.value);
      const matchCount = countMatches(scoreValues, drawnNumbers);

      const matched = scoreValues.filter(s => drawnNumbers.includes(s));

      if (matchCount >= 5) {
        fiveMatchWinners.push({ userId, userName: user?.name || "", matchedNumbers: matched, matchCount, prizeAmount: 0 });
      } else if (matchCount === 4) {
        fourMatchWinners.push({ userId, userName: user?.name || "", matchedNumbers: matched, matchCount, prizeAmount: 0 });
      } else if (matchCount === 3) {
        threeMatchWinners.push({ userId, userName: user?.name || "", matchedNumbers: matched, matchCount, prizeAmount: 0 });
      }
    }

    // Calculate prize amounts
    const jackpotPerWinner = fiveMatchWinners.length > 0 ? draw.jackpotAmount / fiveMatchWinners.length : 0;
    const fourMatchPerWinner = fourMatchWinners.length > 0 ? draw.fourMatchAmount / fourMatchWinners.length : 0;
    const threeMatchPerWinner = threeMatchWinners.length > 0 ? draw.threeMatchAmount / threeMatchWinners.length : 0;

    fiveMatchWinners.forEach(w => w.prizeAmount = jackpotPerWinner);
    fourMatchWinners.forEach(w => w.prizeAmount = fourMatchPerWinner);
    threeMatchWinners.forEach(w => w.prizeAmount = threeMatchPerWinner);

    // Save simulation result
    const [updatedDraw] = await db.update(drawsTable)
      .set({ status: "simulated", drawnNumbers: JSON.stringify(drawnNumbers) })
      .where(eq(drawsTable.id, drawId))
      .returning();

    res.json({
      draw: { ...updatedDraw, drawnNumbers },
      drawnNumbers,
      fiveMatchWinners,
      fourMatchWinners,
      threeMatchWinners,
    });
  } catch (err) {
    req.log.error({ err }, "Error simulating draw");
    res.status(500).json({ error: "InternalServerError", message: "Failed to simulate draw" });
  }
});

// POST /api/draws/:drawId/publish — admin
router.post("/:drawId/publish", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const drawId = parseInt(req.params["drawId"]!);
    const [draw] = await db.select().from(drawsTable).where(eq(drawsTable.id, drawId)).limit(1);
    if (!draw) {
      res.status(404).json({ error: "NotFound", message: "Draw not found" });
      return;
    }

    if (draw.status !== "simulated") {
      res.status(400).json({ error: "BadRequest", message: "Draw must be simulated before publishing" });
      return;
    }

    const drawnNumbers: number[] = draw.drawnNumbers ? JSON.parse(draw.drawnNumbers) as number[] : [];

    // Get active subscribers and find winners
    const activeSubs = await db.select({ userId: subscriptionsTable.userId })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.status, "active"));

    const fiveMatchWinnerIds: number[] = [];
    const fourMatchWinnerIds: number[] = [];
    const threeMatchWinnerIds: number[] = [];

    for (const { userId } of activeSubs) {
      const userScores = await db.select({ value: scoresTable.value })
        .from(scoresTable).where(eq(scoresTable.userId, userId));

      const scoreValues = userScores.map(s => s.value);
      const matchCount = countMatches(scoreValues, drawnNumbers);

      if (matchCount >= 5) fiveMatchWinnerIds.push(userId);
      else if (matchCount === 4) fourMatchWinnerIds.push(userId);
      else if (matchCount === 3) threeMatchWinnerIds.push(userId);
    }

    const jackpotRolledOver = fiveMatchWinnerIds.length === 0;
    const jackpotPerWinner = fiveMatchWinnerIds.length > 0 ? draw.jackpotAmount / fiveMatchWinnerIds.length : 0;
    const fourMatchPerWinner = fourMatchWinnerIds.length > 0 ? draw.fourMatchAmount / fourMatchWinnerIds.length : 0;
    const threeMatchPerWinner = threeMatchWinnerIds.length > 0 ? draw.threeMatchAmount / threeMatchWinnerIds.length : 0;

    // Insert winners
    const winnerInserts = [
      ...fiveMatchWinnerIds.map(userId => ({ userId, drawId, matchType: "five_match" as const, prizeAmount: jackpotPerWinner, status: "pending_verification" as const })),
      ...fourMatchWinnerIds.map(userId => ({ userId, drawId, matchType: "four_match" as const, prizeAmount: fourMatchPerWinner, status: "pending_verification" as const })),
      ...threeMatchWinnerIds.map(userId => ({ userId, drawId, matchType: "three_match" as const, prizeAmount: threeMatchPerWinner, status: "pending_verification" as const })),
    ];

    if (winnerInserts.length > 0) {
      await db.insert(winnersTable).values(winnerInserts);
    }

    const [updatedDraw] = await db.update(drawsTable)
      .set({ status: "published", jackpotRolledOver, publishedAt: new Date() })
      .where(eq(drawsTable.id, drawId))
      .returning();

    res.json({ ...updatedDraw, drawnNumbers });
  } catch (err) {
    req.log.error({ err }, "Error publishing draw");
    res.status(500).json({ error: "InternalServerError", message: "Failed to publish draw" });
  }
});

export default router;
