import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  brainDumpCount: integer("brain_dump_count").default(0).notNull(),
  resetCount: integer("reset_count").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  brainDumps: many(brainDumps),
  favorites: many(favorites),
  resets: many(resets),
  scores: many(scores),
  purchases: many(purchases),
}));

export const sessions = pgTable("sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const brainDumps = pgTable("brain_dumps", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  input: text("input").notNull(),
  today: jsonb("today").$type<string[]>().default([]).notNull(),
  canWait: jsonb("can_wait").$type<string[]>().default([]).notNull(),
  delegate: jsonb("delegate").$type<string[]>().default([]).notNull(),
  ignore: jsonb("ignore_tasks").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const brainDumpsRelations = relations(brainDumps, ({ one }) => ({
  user: one(users, {
    fields: [brainDumps.userId],
    references: [users.id],
  }),
}));

export const favorites = pgTable("favorites", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  category: text("category"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));

export const resets = pgTable("resets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const resetsRelations = relations(resets, ({ one }) => ({
  user: one(users, {
    fields: [resets.userId],
    references: [users.id],
  }),
}));

export const scores = pgTable("scores", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  answers: jsonb("answers").$type<number[]>().default([]).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const scoresRelations = relations(scores, ({ one }) => ({
  user: one(users, {
    fields: [scores.userId],
    references: [users.id],
  }),
}));

export const purchases = pgTable("purchases", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const insertBrainDumpSchema = createInsertSchema(brainDumps).pick({
  input: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).pick({
  type: true,
  category: true,
  content: true,
});

export const insertScoreSchema = createInsertSchema(scores).pick({
  score: true,
  answers: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type BrainDump = typeof brainDumps.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Reset = typeof resets.$inferSelect;
export type Score = typeof scores.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
