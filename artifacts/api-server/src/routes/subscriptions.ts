import { Router } from "express";
import { db } from "../lib/db";
import { subscriptionsTable, usersTable, donationsTable, charitiesTable } from "../lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/authenticate.js";
import { SUBSCRIPTION_PRICES, PRIZE_POOL_PERCENTAGE } from "../lib/db";
import Stripe from "stripe";

const router = Router();

function calcAmounts(plan: "monthly" | "yearly", charityPercentage: number) {
  const amount = SUBSCRIPTION_PRICES[plan];
  const charityContribution = amount * (charityPercentage / 100);
  const afterCharity = amount - charityContribution;
  const prizeContribution = afterCharity * PRIZE_POOL_PERCENTAGE;
  return { amount, prizeContribution, charityContribution };
}

async function expireIfPastRenewal(userId: number) {
  const now = new Date();
  const [sub] = await db.select().from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);

  if (sub && sub.status === "active" && sub.renewalDate && sub.renewalDate < now) {
    await db.update(subscriptionsTable)
      .set({ status: "expired" })
      .where(eq(subscriptionsTable.id, sub.id));
    return { ...sub, status: "expired" as const };
  }
  return sub || null;
}

// GET /api/subscriptions/my
router.get("/my", authenticate, async (req: AuthRequest, res) => {
  try {
    const sub = await expireIfPastRenewal(req.userId!);

    if (!sub) {
      res.status(404).json({ error: "NotFound", message: "No subscription found" });
      return;
    }

    res.json(sub);
  } catch (err) {
    req.log.error({ err }, "Error getting subscription");
    res.status(500).json({ error: "InternalServerError", message: "Failed to get subscription" });
  }
});

// POST /api/subscriptions
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { plan, charityId, charityPercentage = 10 } = req.body;

    if (!plan || !["monthly", "yearly"].includes(plan)) {
      res.status(400).json({ error: "BadRequest", message: "Invalid plan. Must be monthly or yearly" });
      return;
    }

    if (charityPercentage < 10 || charityPercentage > 100) {
      res.status(400).json({ error: "BadRequest", message: "Charity percentage must be between 10 and 100" });
      return;
    }

    const { amount, prizeContribution, charityContribution } = calcAmounts(plan, charityPercentage);
    const startDate = new Date();
    const renewalDate = new Date(startDate);
    if (plan === "monthly") {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    } else {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    }

    const [sub] = await db.insert(subscriptionsTable).values({
      userId: req.userId!,
      plan,
      status: "active",
      amount,
      prizeContribution,
      charityContribution,
      charityId: charityId || null,
      charityPercentage,
      startDate,
      renewalDate,
    }).returning();

    // Update user's charity selection if provided
    if (charityId) {
      await db.update(usersTable).set({ charityId, charityPercentage }).where(eq(usersTable.id, req.userId!));

      // Track donation to charity
      await db.insert(donationsTable).values({
        userId: req.userId!,
        charityId,
        amount: charityContribution,
        message: `Subscription charity contribution (${plan} plan)`,
        status: "completed",
      });

      // Update charity totals
      const [charity] = await db.select().from(charitiesTable)
        .where(eq(charitiesTable.id, charityId));
      if (charity) {
        await db.update(charitiesTable)
          .set({
            totalContributions: (charity.totalContributions || 0) + charityContribution,
            subscriberCount: sql`${charitiesTable.subscriberCount} + 1`,
          })
          .where(eq(charitiesTable.id, charityId));
      }
    }

    res.status(201).json(sub);
  } catch (err) {
    req.log.error({ err }, "Error creating subscription");
    res.status(500).json({ error: "InternalServerError", message: "Failed to create subscription" });
  }
});

// GET /api/subscriptions — admin
router.get("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    let query = db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.createdAt));

    if (status) {
      const subs = await db.select().from(subscriptionsTable)
        .where(eq(subscriptionsTable.status, status as "active" | "cancelled" | "expired" | "pending"))
        .orderBy(desc(subscriptionsTable.createdAt));
      res.json(subs);
      return;
    }

    const subs = await query;
    res.json(subs);
  } catch (err) {
    req.log.error({ err }, "Error listing subscriptions");
    res.status(500).json({ error: "InternalServerError", message: "Failed to list subscriptions" });
  }
});

// POST /api/subscriptions/:subscriptionId/cancel
router.post("/:subscriptionId/cancel", authenticate, async (req: AuthRequest, res) => {
  try {
    const subscriptionId = parseInt(req.params["subscriptionId"]!);

    const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, subscriptionId)).limit(1);
    if (!sub) {
      res.status(404).json({ error: "NotFound", message: "Subscription not found" });
      return;
    }

    if (req.userRole !== "admin" && sub.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden", message: "Access denied" });
      return;
    }

    const [updated] = await db.update(subscriptionsTable)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(subscriptionsTable.id, subscriptionId))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error cancelling subscription");
    res.status(500).json({ error: "InternalServerError", message: "Failed to cancel subscription" });
  }
});

// POST /api/subscriptions/webhooks/stripe
router.post("/webhooks/stripe", async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    req.log.error({ err }, "Webhook signature verification failed");
    res.status(400).json({ error: "Webhook signature verification failed" });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.metadata?.subscriptionId;

        if (subscriptionId) {
          // Mark subscription as active
          await db.update(subscriptionsTable)
            .set({ status: "active" })
            .where(eq(subscriptionsTable.id, parseInt(subscriptionId)));
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Handle renewal payments
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        // Handle subscription cancellations
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "Error processing webhook");
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
