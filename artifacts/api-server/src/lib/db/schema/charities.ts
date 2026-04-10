import { pgTable, serial, text, boolean, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const charitiesTable = pgTable("charities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  website: text("website"),
  featured: boolean("featured").default(false).notNull(),
  totalContributions: real("total_contributions").default(0).notNull(),
  subscriberCount: integer("subscriber_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const charityEventsTable = pgTable("charity_events", {
  id: serial("id").primaryKey(),
  charityId: integer("charity_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCharitySchema = createInsertSchema(charitiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCharity = z.infer<typeof insertCharitySchema>;
export type Charity = typeof charitiesTable.$inferSelect;

export const insertCharityEventSchema = createInsertSchema(charityEventsTable).omit({ id: true, createdAt: true });
export type InsertCharityEvent = z.infer<typeof insertCharityEventSchema>;
export type CharityEvent = typeof charityEventsTable.$inferSelect;
