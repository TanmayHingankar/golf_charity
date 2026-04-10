import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scoresTable = pgTable("scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  value: integer("value").notNull(),
  playedAt: timestamp("played_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScoreSchema = createInsertSchema(scoresTable).omit({ id: true, createdAt: true });
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scoresTable.$inferSelect;

export const MAX_SCORES_PER_USER = 5;
export const SCORE_MIN = 1;
export const SCORE_MAX = 45;
