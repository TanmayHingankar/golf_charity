import { Router } from "express";
import { db } from "@workspace/db";
import { donationsTable, charitiesTable, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/authenticate.js";

const router = Router();

// POST /api/donations — create an independent donation
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { charityId, amount, message } = req.body;

    if (!charityId || !amount) {
      res.status(400).json({ error: "BadRequest", message: "charityId and amount are required" });
      return;
    }

    if (amount < 1 || amount > 10000) {
      res.status(400).json({ error: "BadRequest", message: "Amount must be between £1 and £10,000" });
      return;
    }

    const [charity] = await db.select().from(charitiesTable).where(eq(charitiesTable.id, charityId)).limit(1);
    if (!charity) {
      res.status(404).json({ error: "NotFound", message: "Charity not found" });
      return;
    }

    const [donation] = await db.insert(donationsTable).values({
      userId: req.userId!,
      charityId,
      amount,
      message: message || null,
      status: "completed",
    }).returning();

    res.status(201).json(donation);
  } catch (err) {
    req.log.error({ err }, "Error creating donation");
    res.status(500).json({ error: "InternalServerError", message: "Failed to create donation" });
  }
});

// GET /api/donations/my — current user's donation history
router.get("/my", authenticate, async (req: AuthRequest, res) => {
  try {
    const donations = await db.select({
      id: donationsTable.id,
      amount: donationsTable.amount,
      message: donationsTable.message,
      status: donationsTable.status,
      createdAt: donationsTable.createdAt,
      charityId: donationsTable.charityId,
      charityName: charitiesTable.name,
    })
      .from(donationsTable)
      .leftJoin(charitiesTable, eq(donationsTable.charityId, charitiesTable.id))
      .where(eq(donationsTable.userId, req.userId!))
      .orderBy(desc(donationsTable.createdAt));

    const total = donations.reduce((sum, d) => sum + d.amount, 0);
    res.json({ total, donations });
  } catch (err) {
    req.log.error({ err }, "Error getting donations");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get donations" });
  }
});

// GET /api/donations — admin view all
router.get("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const donations = await db.select({
      id: donationsTable.id,
      amount: donationsTable.amount,
      message: donationsTable.message,
      status: donationsTable.status,
      createdAt: donationsTable.createdAt,
      charityId: donationsTable.charityId,
      charityName: charitiesTable.name,
      userId: donationsTable.userId,
      userName: usersTable.name,
    })
      .from(donationsTable)
      .leftJoin(charitiesTable, eq(donationsTable.charityId, charitiesTable.id))
      .leftJoin(usersTable, eq(donationsTable.userId, usersTable.id))
      .orderBy(desc(donationsTable.createdAt));

    const total = donations.reduce((sum, d) => sum + d.amount, 0);
    res.json({ total, donations });
  } catch (err) {
    req.log.error({ err }, "Error getting all donations");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get donations" });
  }
});

export default router;
