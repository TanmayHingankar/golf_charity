import { pgTable, serial, integer, text, real, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const drawStatusEnum = pgEnum("draw_status", ["pending", "simulated", "published"]);
export const drawTypeEnum = pgEnum("draw_type", ["random", "algorithmic"]);
export const matchTypeEnum = pgEnum("match_type", ["five_match", "four_match", "three_match"]);
export const winnerStatusEnum = pgEnum("winner_status", ["pending_verification", "verified", "rejected", "paid"]);

export const drawsTable = pgTable("draws", {
  id: serial("id").primaryKey(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  status: drawStatusEnum("status").notNull().default("pending"),
  drawType: drawTypeEnum("draw_type").notNull().default("random"),
  drawnNumbers: text("drawn_numbers"),
  totalPrizePool: real("total_prize_pool").notNull().default(0),
  jackpotAmount: real("jackpot_amount").notNull().default(0),
  fourMatchAmount: real("four_match_amount").notNull().default(0),
  threeMatchAmount: real("three_match_amount").notNull().default(0),
  jackpotRolledOver: boolean("jackpot_rolled_over").notNull().default(false),
  participantCount: integer("participant_count").notNull().default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const winnersTable = pgTable("winners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  drawId: integer("draw_id").notNull(),
  matchType: matchTypeEnum("match_type").notNull(),
  prizeAmount: real("prize_amount").notNull(),
  status: winnerStatusEnum("status").notNull().default("pending_verification"),
  proofImageUrl: text("proof_image_url"),
  adminNote: text("admin_note"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDrawSchema = createInsertSchema(drawsTable).omit({ id: true, createdAt: true });
export type InsertDraw = z.infer<typeof insertDrawSchema>;
export type Draw = typeof drawsTable.$inferSelect;

export const insertWinnerSchema = createInsertSchema(winnersTable).omit({ id: true, createdAt: true });
export type InsertWinner = z.infer<typeof insertWinnerSchema>;
export type Winner = typeof winnersTable.$inferSelect;
