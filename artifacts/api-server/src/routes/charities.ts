import { Router } from "express";
import { db } from "@workspace/db";
import { charitiesTable, charityEventsTable, usersTable } from "@workspace/db";
import { eq, ilike, desc } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/authenticate.js";

const router = Router();

async function getCharityWithEvents(charityId: number) {
  const [charity] = await db.select().from(charitiesTable).where(eq(charitiesTable.id, charityId)).limit(1);
  if (!charity) return null;
  const events = await db.select().from(charityEventsTable).where(eq(charityEventsTable.charityId, charityId));
  return { ...charity, upcomingEvents: events };
}

// GET /api/charities
router.get("/", async (req, res) => {
  try {
    const search = req.query["search"] as string | undefined;
    const featured = req.query["featured"];

    let query = db.select().from(charitiesTable).orderBy(desc(charitiesTable.featured), desc(charitiesTable.totalContributions));

    let charities;
    if (search) {
      charities = await db.select().from(charitiesTable)
        .where(ilike(charitiesTable.name, `%${search}%`))
        .orderBy(desc(charitiesTable.featured));
    } else if (featured === "true") {
      charities = await db.select().from(charitiesTable)
        .where(eq(charitiesTable.featured, true));
    } else {
      charities = await query;
    }

    const charitiesWithEvents = await Promise.all(
      charities.map(async (c) => {
        const events = await db.select().from(charityEventsTable).where(eq(charityEventsTable.charityId, c.id));
        return { ...c, upcomingEvents: events };
      })
    );

    res.json(charitiesWithEvents);
  } catch (err) {
    (req as any).log.error({ err }, "Error listing charities");
    res.status(500).json({ error: "InternalServerError", message: "Failed to list charities" });
  }
});

// POST /api/charities — admin
router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, description, imageUrl, website, featured } = req.body;

    if (!name || !description) {
      res.status(400).json({ error: "BadRequest", message: "Name and description are required" });
      return;
    }

    const [charity] = await db.insert(charitiesTable).values({
      name, description, imageUrl, website, featured: featured || false,
    }).returning();

    res.status(201).json({ ...charity, upcomingEvents: [] });
  } catch (err) {
    req.log.error({ err }, "Error creating charity");
    res.status(500).json({ error: "InternalServerError", message: "Failed to create charity" });
  }
});

// GET /api/charities/my — must come before /:charityId
router.get("/my", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user || !user.charityId) {
      res.json({ charity: null, charityId: null, charityPercentage: user?.charityPercentage || null });
      return;
    }

    const charity = await getCharityWithEvents(user.charityId);
    res.json({ charity, charityId: user.charityId, charityPercentage: user.charityPercentage });
  } catch (err) {
    req.log.error({ err }, "Error getting user charity");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get charity selection" });
  }
});

// POST /api/charities/select
router.post("/select", authenticate, async (req: AuthRequest, res) => {
  try {
    const { charityId, charityPercentage } = req.body;

    if (!charityId) {
      res.status(400).json({ error: "BadRequest", message: "charityId is required" });
      return;
    }

    if (charityPercentage < 10 || charityPercentage > 100) {
      res.status(400).json({ error: "BadRequest", message: "Charity percentage must be between 10 and 100" });
      return;
    }

    const [charity] = await db.select().from(charitiesTable).where(eq(charitiesTable.id, charityId)).limit(1);
    if (!charity) {
      res.status(404).json({ error: "NotFound", message: "Charity not found" });
      return;
    }

    await db.update(usersTable).set({ charityId, charityPercentage }).where(eq(usersTable.id, req.userId!));

    const charityWithEvents = await getCharityWithEvents(charityId);
    res.json({ charity: charityWithEvents, charityId, charityPercentage });
  } catch (err) {
    req.log.error({ err }, "Error selecting charity");
    res.status(500).json({ error: "InternalServerError", message: "Failed to select charity" });
  }
});

// GET /api/charities/:charityId
router.get("/:charityId", async (req, res) => {
  try {
    const charityId = parseInt(req.params["charityId"]!);
    const charity = await getCharityWithEvents(charityId);
    if (!charity) {
      res.status(404).json({ error: "NotFound", message: "Charity not found" });
      return;
    }
    res.json(charity);
  } catch (err) {
    (req as any).log.error({ err }, "Error getting charity");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get charity" });
  }
});

// PATCH /api/charities/:charityId — admin
router.patch("/:charityId", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const charityId = parseInt(req.params["charityId"]!);
    const { name, description, imageUrl, website, featured } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof name === "string") updates["name"] = name;
    if (typeof description === "string") updates["description"] = description;
    if (typeof imageUrl === "string") updates["imageUrl"] = imageUrl;
    if (typeof website === "string") updates["website"] = website;
    if (typeof featured === "boolean") updates["featured"] = featured;

    const [updated] = await db.update(charitiesTable).set(updates).where(eq(charitiesTable.id, charityId)).returning();
    if (!updated) {
      res.status(404).json({ error: "NotFound", message: "Charity not found" });
      return;
    }

    const events = await db.select().from(charityEventsTable).where(eq(charityEventsTable.charityId, charityId));
    res.json({ ...updated, upcomingEvents: events });
  } catch (err) {
    req.log.error({ err }, "Error updating charity");
    res.status(500).json({ error: "InternalServerError", message: "Failed to update charity" });
  }
});

// DELETE /api/charities/:charityId — admin
router.delete("/:charityId", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const charityId = parseInt(req.params["charityId"]!);
    await db.delete(charityEventsTable).where(eq(charityEventsTable.charityId, charityId));
    await db.delete(charitiesTable).where(eq(charitiesTable.id, charityId));
    res.json({ message: "Charity deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Error deleting charity");
    res.status(500).json({ error: "InternalServerError", message: "Failed to delete charity" });
  }
});

export default router;
