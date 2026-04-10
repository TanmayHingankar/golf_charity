import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { charitiesTable } from "./charities";

export const donationsTable = pgTable("donations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  charityId: integer("charity_id").references(() => charitiesTable.id).notNull(),
  amount: real("amount").notNull(),
  message: text("message"),
  status: text("status", { enum: ["pending", "completed"] }).default("completed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
