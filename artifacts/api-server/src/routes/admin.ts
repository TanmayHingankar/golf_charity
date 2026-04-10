import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, subscriptionsTable, drawsTable, winnersTable, charitiesTable, scoresTable, donationsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/authenticate.js";
import { PRIZE_POOL_DISTRIBUTION } from "@workspace/db";

const router = Router();

// GET /api/admin/stats
router.get("/stats", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const [
      totalUsersResult,
      activeSubsResult,
      pendingDrawsResult,
      pendingVerificationsResult,
      monthlyRevResult,
      yearlyRevResult,
      totalCharityResult,
      activeCharitiesResult,
      totalDonationsResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
      db.select({ count: sql<number>`count(*)::int` }).from(subscriptionsTable).where(eq(subscriptionsTable.status, "active")),
      db.select({ count: sql<number>`count(*)::int` }).from(drawsTable).where(eq(drawsTable.status, "pending")),
      db.select({ count: sql<number>`count(*)::int` }).from(winnersTable).where(eq(winnersTable.status, "pending_verification")),
      db.select({ total: sql<number>`coalesce(sum(amount), 0)::float` }).from(subscriptionsTable)
        .where(eq(subscriptionsTable.plan, "monthly")),
      db.select({ total: sql<number>`coalesce(sum(amount), 0)::float` }).from(subscriptionsTable)
        .where(eq(subscriptionsTable.plan, "yearly")),
      db.select({ total: sql<number>`coalesce(sum(charity_contribution), 0)::float` }).from(subscriptionsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(charitiesTable),
      db.select({ total: sql<number>`coalesce(sum(amount), 0)::float` }).from(donationsTable),
    ]);

    const activeSubs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.status, "active"));
    const totalPrizePool = activeSubs.reduce((sum, s) => sum + s.prizeContribution, 0);

    res.json({
      totalUsers: totalUsersResult[0]?.count || 0,
      activeSubscribers: activeSubsResult[0]?.count || 0,
      activeSubscriptions: activeSubsResult[0]?.count || 0,
      totalPrizePool,
      totalCharityContributions: totalCharityResult[0]?.total || 0,
      totalDirectDonations: totalDonationsResult[0]?.total || 0,
      pendingDraws: pendingDrawsResult[0]?.count || 0,
      pendingVerifications: pendingVerificationsResult[0]?.count || 0,
      activeCharities: activeCharitiesResult[0]?.count || 0,
      monthlyRevenue: monthlyRevResult[0]?.total || 0,
      yearlyRevenue: yearlyRevResult[0]?.total || 0,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting admin stats");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get stats" });
  }
});

// GET /api/admin/prize-pool — public for landing page stats
router.get("/prize-pool", async (req, res) => {
  try {
    const activeSubs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.status, "active"));
    const totalPool = activeSubs.reduce((sum, s) => sum + s.prizeContribution, 0);

    // Check for jackpot carryover
    const [lastDraw] = await db.select().from(drawsTable)
      .where(eq(drawsTable.status, "published"))
      .orderBy(desc(drawsTable.year), desc(drawsTable.month))
      .limit(1);

    const jackpotCarryover = lastDraw?.jackpotRolledOver ? lastDraw.jackpotAmount : 0;
    const subscriptionContributionPerUser = activeSubs.length > 0
      ? totalPool / activeSubs.length
      : 0;

    res.json({
      totalPool,
      jackpotPool: totalPool * PRIZE_POOL_DISTRIBUTION.five_match + jackpotCarryover,
      fourMatchPool: totalPool * PRIZE_POOL_DISTRIBUTION.four_match,
      threeMatchPool: totalPool * PRIZE_POOL_DISTRIBUTION.three_match,
      jackpotCarryover,
      activeSubscribers: activeSubs.length,
      subscriptionContributionPerUser,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting prize pool");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get prize pool" });
  }
});

// GET /api/dashboard/summary — user dashboard summary
router.get("/summary", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const [subscription] = await db.select().from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userId))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);

    const scores = await db.select().from(scoresTable)
      .where(eq(scoresTable.userId, userId))
      .orderBy(desc(scoresTable.playedAt))
      .limit(5);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    
    let charity = null;
    if (user?.charityId) {
      const [c] = await db.select().from(charitiesTable).where(eq(charitiesTable.id, user.charityId)).limit(1);
      charity = c;
    }

    const [upcomingDraw] = await db.select().from(drawsTable)
      .where(eq(drawsTable.status, "pending"))
      .orderBy(desc(drawsTable.year), desc(drawsTable.month))
      .limit(1);

    const drawsEntered = subscription ? 1 : 0;

    const myWinners = await db.select().from(winnersTable).where(eq(winnersTable.userId, userId));
    const pendingWinners = myWinners.filter(w => w.status === "pending_verification");
    const totalWon = myWinners
      .filter(w => w.status === "paid" || w.status === "verified")
      .reduce((sum, w) => sum + w.prizeAmount, 0);

    res.json({
      subscription: subscription || null,
      scores,
      charity,
      charityPercentage: user?.charityPercentage || null,
      totalWon,
      upcomingDraw: upcomingDraw ? { ...upcomingDraw, drawnNumbers: upcomingDraw.drawnNumbers ? JSON.parse(upcomingDraw.drawnNumbers) : null } : null,
      drawsEntered,
      pendingWinners: pendingWinners.map(w => ({
        ...w,
        userName: user?.name || "",
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting dashboard summary");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get dashboard summary" });
  }
});

export default router;
