import { Router } from "express";
import { db } from "@workspace/db";
import { winnersTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/authenticate.js";
import multer from "multer";
import cloudinary from "cloudinary";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const router = Router();

async function enrichWinner(winner: typeof winnersTable.$inferSelect) {
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, winner.userId)).limit(1);
  return {
    ...winner,
    userName: user?.name || "Unknown",
  };
}

// GET /api/winners
router.get("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { status, drawId } = req.query;

    let conditions: ReturnType<typeof eq>[] = [];
    if (status) conditions.push(eq(winnersTable.status, status as "pending_verification" | "verified" | "rejected" | "paid"));
    if (drawId) conditions.push(eq(winnersTable.drawId, parseInt(drawId as string)));

    const winners = await db.select().from(winnersTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(winnersTable.createdAt));

    const enriched = await Promise.all(winners.map(enrichWinner));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error listing winners");
    res.status(500).json({ error: "InternalServerError", message: "Failed to list winners" });
  }
});

// GET /api/winners/my
router.get("/my", authenticate, async (req: AuthRequest, res) => {
  try {
    const winners = await db.select().from(winnersTable)
      .where(eq(winnersTable.userId, req.userId!))
      .orderBy(desc(winnersTable.createdAt));

    const enriched = await Promise.all(winners.map(enrichWinner));
    const totalWon = winners
      .filter(w => w.status === "paid" || w.status === "verified")
      .reduce((sum, w) => sum + w.prizeAmount, 0);

    res.json({ totalWon, winners: enriched });
  } catch (err) {
    req.log.error({ err }, "Error getting user winnings");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get winnings" });
  }
});

// POST /api/winners/:winnerId/upload-proof
router.post("/:winnerId/upload-proof", authenticate, upload.single("proof"), async (req: AuthRequest, res) => {
  try {
    const winnerId = parseInt(req.params["winnerId"]!);

    if (!req.file) {
      res.status(400).json({ error: "BadRequest", message: "No file uploaded" });
      return;
    }

    const [winner] = await db.select().from(winnersTable).where(eq(winnersTable.id, winnerId)).limit(1);
    if (!winner) {
      res.status(404).json({ error: "NotFound", message: "Winner not found" });
      return;
    }

    if (winner.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden", message: "You can only upload proof for your own winnings" });
      return;
    }

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "golf-winners",
          public_id: `winner-${winnerId}-${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file!.buffer);
    });

    // Update winner with proof URL
    const [updated] = await db.update(winnersTable)
      .set({
        proofImageUrl: result.secure_url,
        status: "pending_verification"
      })
      .where(eq(winnersTable.id, winnerId))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error uploading winner proof");
    res.status(500).json({ error: "InternalServerError", message: "Failed to upload proof" });
  }
});

// POST /api/winners/:winnerId/submit-proof
router.post("/:winnerId/submit-proof", authenticate, async (req: AuthRequest, res) => {
  try {
    const winnerId = parseInt(req.params["winnerId"]!);
    const { proofImageUrl } = req.body;

    if (!proofImageUrl) {
      res.status(400).json({ error: "BadRequest", message: "proofImageUrl is required" });
      return;
    }

    const [winner] = await db.select().from(winnersTable).where(eq(winnersTable.id, winnerId)).limit(1);
    if (!winner) {
      res.status(404).json({ error: "NotFound", message: "Winner not found" });
      return;
    }

    if (winner.userId !== req.userId && req.userRole !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Access denied" });
      return;
    }

    const [updated] = await db.update(winnersTable)
      .set({ proofImageUrl, status: "pending_verification" })
      .where(eq(winnersTable.id, winnerId))
      .returning();

    const enriched = await enrichWinner(updated!);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error submitting winner proof");
    res.status(500).json({ error: "InternalServerError", message: "Failed to submit proof" });
  }
});

// POST /api/winners/:winnerId/verify — admin
router.post("/:winnerId/verify", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const winnerId = parseInt(req.params["winnerId"]!);
    const { approved, adminNote } = req.body;

    if (approved === undefined) {
      res.status(400).json({ error: "BadRequest", message: "approved boolean is required" });
      return;
    }

    const [updated] = await db.update(winnersTable)
      .set({
        status: approved ? "verified" : "rejected",
        adminNote: adminNote || null,
      })
      .where(eq(winnersTable.id, winnerId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "NotFound", message: "Winner not found" });
      return;
    }

    const enriched = await enrichWinner(updated);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error verifying winner");
    res.status(500).json({ error: "InternalServerError", message: "Failed to verify winner" });
  }
});

// POST /api/winners/:winnerId/mark-paid — admin
router.post("/:winnerId/mark-paid", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const winnerId = parseInt(req.params["winnerId"]!);

    const [updated] = await db.update(winnersTable)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(winnersTable.id, winnerId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "NotFound", message: "Winner not found" });
      return;
    }

    const enriched = await enrichWinner(updated);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error marking winner paid");
    res.status(500).json({ error: "InternalServerError", message: "Failed to mark as paid" });
  }
});

export default router;
