import { pgTable, serial, integer, text, real, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionPlanEnum = pgEnum("subscription_plan", ["monthly", "yearly"]);
export const subscriptionStatusDbEnum = pgEnum("subscription_status_db", ["active", "cancelled", "expired", "pending"]);

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: subscriptionStatusDbEnum("status").notNull().default("pending"),
  amount: real("amount").notNull(),
  prizeContribution: real("prize_contribution").notNull(),
  charityContribution: real("charity_contribution").notNull(),
  charityId: integer("charity_id"),
  charityPercentage: real("charity_percentage").default(10),
  startDate: timestamp("start_date").defaultNow().notNull(),
  renewalDate: timestamp("renewal_date"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;

// Pricing config
export const SUBSCRIPTION_PRICES = {
  monthly: 19.99,
  yearly: 199.99,
};

// Prize pool: 30% of subscription goes to prize pool
export const PRIZE_POOL_PERCENTAGE = 0.30;
// Remaining after prize pool goes to platform (minus charity)
export const PRIZE_POOL_DISTRIBUTION = {
  five_match: 0.40,
  four_match: 0.35,
  three_match: 0.25,
};
