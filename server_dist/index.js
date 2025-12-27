var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// server/shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  brainDumps: () => brainDumps,
  brainDumpsRelations: () => brainDumpsRelations,
  favorites: () => favorites,
  favoritesRelations: () => favoritesRelations,
  insertBrainDumpSchema: () => insertBrainDumpSchema,
  insertFavoriteSchema: () => insertFavoriteSchema,
  insertScoreSchema: () => insertScoreSchema,
  insertUserSchema: () => insertUserSchema,
  loginUserSchema: () => loginUserSchema,
  purchases: () => purchases,
  purchasesRelations: () => purchasesRelations,
  resets: () => resets,
  resetsRelations: () => resetsRelations,
  scores: () => scores,
  scoresRelations: () => scoresRelations,
  sessions: () => sessions,
  sessionsRelations: () => sessionsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  brainDumpCount: integer("brain_dump_count").default(0).notNull(),
  resetCount: integer("reset_count").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  brainDumps: many(brainDumps),
  favorites: many(favorites),
  resets: many(resets),
  scores: many(scores),
  purchases: many(purchases)
}));
var sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));
var brainDumps = pgTable("brain_dumps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  input: text("input").notNull(),
  today: jsonb("today").$type().default([]).notNull(),
  canWait: jsonb("can_wait").$type().default([]).notNull(),
  delegate: jsonb("delegate").$type().default([]).notNull(),
  ignore: jsonb("ignore_tasks").$type().default([]).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var brainDumpsRelations = relations(brainDumps, ({ one }) => ({
  user: one(users, {
    fields: [brainDumps.userId],
    references: [users.id]
  })
}));
var favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  category: text("category"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id]
  })
}));
var resets = pgTable("resets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var resetsRelations = relations(resets, ({ one }) => ({
  user: one(users, {
    fields: [resets.userId],
    references: [users.id]
  })
}));
var scores = pgTable("scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  answers: jsonb("answers").$type().default([]).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var scoresRelations = relations(scores, ({ one }) => ({
  user: one(users, {
    fields: [scores.userId],
    references: [users.id]
  })
}));
var purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true
});
var loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
var insertBrainDumpSchema = createInsertSchema(brainDumps).pick({
  input: true
});
var insertFavoriteSchema = createInsertSchema(favorites).pick({
  type: true,
  category: true,
  content: true
});
var insertScoreSchema = createInsertSchema(scores).pick({
  score: true,
  answers: true
});

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUserPremium(userId, isPremium) {
    await db.update(users).set({ isPremium }).where(eq(users.id, userId));
  }
  async incrementBrainDumpCount(userId) {
    const user = await this.getUser(userId);
    if (user) {
      await db.update(users).set({ brainDumpCount: user.brainDumpCount + 1 }).where(eq(users.id, userId));
    }
  }
  async incrementResetCount(userId) {
    const user = await this.getUser(userId);
    if (user) {
      await db.update(users).set({ resetCount: user.resetCount + 1 }).where(eq(users.id, userId));
    }
  }
  async createSession(userId, token, expiresAt) {
    const [session] = await db.insert(sessions).values({ userId, token, expiresAt }).returning();
    return session;
  }
  async getSessionByToken(token) {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    return session || void 0;
  }
  async deleteSession(token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  async createBrainDump(userId, input, today, canWait, delegate, ignore) {
    const [brainDump] = await db.insert(brainDumps).values({ userId, input, today, canWait, delegate, ignore }).returning();
    return brainDump;
  }
  async getBrainDumps(userId) {
    return db.select().from(brainDumps).where(eq(brainDumps.userId, userId)).orderBy(desc(brainDumps.createdAt));
  }
  async createFavorite(userId, type, category, content) {
    const [favorite] = await db.insert(favorites).values({ userId, type, category, content }).returning();
    return favorite;
  }
  async getFavorites(userId) {
    return db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
  }
  async deleteFavorite(id, userId) {
    await db.delete(favorites).where(eq(favorites.id, id));
  }
  async createReset(userId) {
    const [reset] = await db.insert(resets).values({ userId }).returning();
    return reset;
  }
  async getResets(userId) {
    return db.select().from(resets).where(eq(resets.userId, userId)).orderBy(desc(resets.completedAt));
  }
  async getResetCount(userId) {
    const userResets = await this.getResets(userId);
    return userResets.length;
  }
  async createScore(userId, score, answers) {
    const [scoreRecord] = await db.insert(scores).values({ userId, score, answers }).returning();
    return scoreRecord;
  }
  async getScores(userId) {
    return db.select().from(scores).where(eq(scores.userId, userId)).orderBy(desc(scores.createdAt));
  }
  async createPurchase(userId, stripeSessionId, amount) {
    const [purchase] = await db.insert(purchases).values({ userId, stripeSessionId, amount }).returning();
    return purchase;
  }
  async getPurchaseBySessionId(stripeSessionId) {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.stripeSessionId, stripeSessionId));
    return purchase || void 0;
  }
  async updatePurchaseStatus(stripeSessionId, status, customerId) {
    const updateData = { status };
    if (customerId) {
      updateData.stripeCustomerId = customerId;
    }
    await db.update(purchases).set(updateData).where(eq(purchases.stripeSessionId, stripeSessionId));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
var openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});
var FREE_BRAIN_DUMP_LIMIT = 2;
var FREE_RESET_LIMIT = 1;
var BCRYPT_ROUNDS = 12;
var JWT_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";
var JWT_EXPIRY = "30d";
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function generateToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  const user = await storage.getUser(payload.userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  req.user = {
    id: user.id,
    email: user.email,
    isPremium: user.isPremium,
    brainDumpCount: user.brainDumpCount,
    resetCount: user.resetCount
  };
  next();
}
var rateLimitMap = /* @__PURE__ */ new Map();
var RATE_LIMIT_WINDOW = 60 * 1e3;
var RATE_LIMIT_MAX = 20;
function rateLimitMiddleware(req, res, next) {
  const userId = req.user?.id || req.ip || "anonymous";
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }
  userLimit.count++;
  next();
}
async function registerRoutes(app2) {
  app2.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ email, password: hashedPassword });
      const token = generateToken(user.id, user.email);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          isPremium: user.isPremium,
          brainDumpCount: user.brainDumpCount,
          resetCount: user.resetCount
        }
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const token = generateToken(user.id, user.email);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          isPremium: user.isPremium,
          brainDumpCount: user.brainDumpCount,
          resetCount: user.resetCount
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });
  app2.post("/api/auth/logout", authMiddleware, async (_req, res) => {
    res.json({ success: true });
  });
  app2.get("/api/me", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const resetCount = await storage.getResetCount(user.id);
      res.json({
        id: user.id,
        email: user.email,
        isPremium: user.isPremium,
        brainDumpCount: user.brainDumpCount,
        resetCount,
        canUseBrainDump: user.isPremium || user.brainDumpCount < FREE_BRAIN_DUMP_LIMIT,
        canUseReset: user.isPremium || resetCount < FREE_RESET_LIMIT,
        remainingBrainDumps: user.isPremium ? -1 : FREE_BRAIN_DUMP_LIMIT - user.brainDumpCount,
        remainingResets: user.isPremium ? -1 : FREE_RESET_LIMIT - resetCount
      });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ error: "Failed to get user info" });
    }
  });
  app2.post(
    "/api/brain-dump",
    authMiddleware,
    rateLimitMiddleware,
    async (req, res) => {
      try {
        const { input } = req.body;
        if (!input || input.trim().length === 0) {
          return res.status(400).json({ error: "Input is required" });
        }
        const user = await storage.getUser(req.user.id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        if (!user.isPremium && user.brainDumpCount >= FREE_BRAIN_DUMP_LIMIT) {
          return res.status(403).json({
            error: "Free brain dump limit reached",
            requiresPremium: true
          });
        }
        const systemPrompt = `You are a supportive, empathetic assistant helping overwhelmed working moms sort their mental load. Given a brain dump of thoughts, worries, and tasks, categorize them into 4 sections:

1. TODAY (must do) - Urgent, time-sensitive tasks that truly need attention today
2. CAN WAIT - Important but not urgent, can be done later this week
3. DELEGATE - Things that can be given to partner, kids, or others to handle
4. IGNORE (without guilt) - Things that don't actually need to happen, perfectionist tendencies, or low-priority items that cause unnecessary stress

Respond in JSON format:
{
  "today": ["task 1", "task 2"],
  "canWait": ["task 1", "task 2"],
  "delegate": ["task 1", "task 2"],
  "ignore": ["task 1", "task 2"]
}

Be compassionate. If something seems like guilt or societal pressure rather than a real need, put it in IGNORE. Help them feel lighter.`;
        const response = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1024
        });
        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        const brainDump = await storage.createBrainDump(
          user.id,
          input,
          parsed.today || [],
          parsed.canWait || [],
          parsed.delegate || [],
          parsed.ignore || []
        );
        await storage.incrementBrainDumpCount(user.id);
        res.json({
          id: brainDump.id,
          today: parsed.today || [],
          canWait: parsed.canWait || [],
          delegate: parsed.delegate || [],
          ignore: parsed.ignore || []
        });
      } catch (error) {
        console.error("Brain dump error:", error);
        res.status(500).json({ error: "Failed to process brain dump" });
      }
    }
  );
  app2.get("/api/brain-dump/history", authMiddleware, async (req, res) => {
    try {
      const brainDumps2 = await storage.getBrainDumps(req.user.id);
      res.json(brainDumps2);
    } catch (error) {
      console.error("Get brain dumps error:", error);
      res.status(500).json({ error: "Failed to get brain dump history" });
    }
  });
  app2.post(
    "/api/scripts",
    authMiddleware,
    rateLimitMiddleware,
    async (req, res) => {
      try {
        const { category, situation } = req.body;
        if (!category) {
          return res.status(400).json({ error: "Category is required" });
        }
        const user = await storage.getUser(req.user.id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        if (!user.isPremium) {
          return res.status(403).json({
            error: "Scripts require premium",
            requiresPremium: true
          });
        }
        const validCategories = ["partner", "kids", "boss", "in-laws", "friends"];
        if (!validCategories.includes(category.toLowerCase())) {
          return res.status(400).json({ error: "Invalid category" });
        }
        const systemPrompt = `You are a supportive communication coach helping working moms express their needs without guilt. Generate guilt-free scripts for conversations with ${category}.

The scripts should be:
- Assertive but kind
- Clear and direct
- Non-apologetic
- Respectful of boundaries
- Free from guilt-inducing language

${situation ? `Specific situation: ${situation}` : "Generate general boundary-setting and delegation scripts."}

Respond in JSON format:
{
  "shortScripts": ["script 1", "script 2", "script 3", "script 4", "script 5"],
  "longScripts": ["longer script 1", "longer script 2", "longer script 3"]
}

Short scripts should be 1-2 sentences. Long scripts should be 3-5 sentences.`;
        const response = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate scripts for talking to my ${category}` }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1024
        });
        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        res.json({
          category,
          shortScripts: parsed.shortScripts || [],
          longScripts: parsed.longScripts || []
        });
      } catch (error) {
        console.error("Scripts error:", error);
        res.status(500).json({ error: "Failed to generate scripts" });
      }
    }
  );
  app2.post("/api/reset", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const resetCount = await storage.getResetCount(user.id);
      if (!user.isPremium && resetCount >= FREE_RESET_LIMIT) {
        return res.status(403).json({
          error: "Free reset limit reached",
          requiresPremium: true
        });
      }
      const reset = await storage.createReset(user.id);
      await storage.incrementResetCount(user.id);
      res.json({
        id: reset.id,
        completedAt: reset.completedAt,
        totalResets: resetCount + 1
      });
    } catch (error) {
      console.error("Reset error:", error);
      res.status(500).json({ error: "Failed to record reset" });
    }
  });
  app2.get("/api/reset/count", authMiddleware, async (req, res) => {
    try {
      const count = await storage.getResetCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error("Get reset count error:", error);
      res.status(500).json({ error: "Failed to get reset count" });
    }
  });
  app2.post(
    "/api/score",
    authMiddleware,
    rateLimitMiddleware,
    async (req, res) => {
      try {
        const { answers } = req.body;
        if (!answers || !Array.isArray(answers) || answers.length !== 10) {
          return res.status(400).json({ error: "10 answers required" });
        }
        for (const answer of answers) {
          if (typeof answer !== "number" || answer < 1 || answer > 5) {
            return res.status(400).json({ error: "Each answer must be 1-5" });
          }
        }
        const totalScore = answers.reduce((sum, a) => sum + a, 0);
        const maxScore = 50;
        const percentage = Math.round(totalScore / maxScore * 100);
        const avgLoadPercentage = 42;
        const comparison = percentage - avgLoadPercentage;
        const score = await storage.createScore(req.user.id, percentage, answers);
        res.json({
          id: score.id,
          score: percentage,
          comparison: comparison > 0 ? `+${comparison}` : `${comparison}`,
          message: comparison > 0 ? `You're carrying ${comparison}% more load than average` : comparison < 0 ? `You're carrying ${Math.abs(comparison)}% less load than average` : "You're carrying an average mental load"
        });
      } catch (error) {
        console.error("Score error:", error);
        res.status(500).json({ error: "Failed to calculate score" });
      }
    }
  );
  app2.get("/api/score/history", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isPremium) {
        return res.status(403).json({
          error: "Quiz history requires premium",
          requiresPremium: true
        });
      }
      const scores2 = await storage.getScores(req.user.id);
      res.json(scores2);
    } catch (error) {
      console.error("Get scores error:", error);
      res.status(500).json({ error: "Failed to get score history" });
    }
  });
  app2.post("/api/favorites", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isPremium) {
        return res.status(403).json({
          error: "Favorites require premium",
          requiresPremium: true
        });
      }
      const { type, category, content } = req.body;
      if (!type || !content) {
        return res.status(400).json({ error: "Type and content required" });
      }
      const favorite = await storage.createFavorite(
        req.user.id,
        type,
        category || null,
        content
      );
      res.json(favorite);
    } catch (error) {
      console.error("Create favorite error:", error);
      res.status(500).json({ error: "Failed to save favorite" });
    }
  });
  app2.get("/api/favorites", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isPremium) {
        return res.status(403).json({
          error: "Favorites require premium",
          requiresPremium: true
        });
      }
      const favorites2 = await storage.getFavorites(req.user.id);
      res.json(favorites2);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ error: "Failed to get favorites" });
    }
  });
  app2.delete("/api/favorites/:id", authMiddleware, async (req, res) => {
    try {
      await storage.deleteFavorite(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete favorite error:", error);
      res.status(500).json({ error: "Failed to delete favorite" });
    }
  });
  app2.post("/api/purchases/checkout-session", authMiddleware, async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ error: "Stripe not configured" });
      }
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeSecretKey);
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.isPremium) {
        return res.status(400).json({ error: "Already premium" });
      }
      const baseUrl = req.headers.origin || `https://${req.headers.host}`;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Invisible Load Reducer - Full Access",
                description: "Unlimited access to all features. One-time purchase."
              },
              unit_amount: 1400
            },
            quantity: 1
          }
        ],
        mode: "payment",
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/payment-cancelled`,
        customer_email: user.email,
        metadata: {
          userId: user.id
        }
      });
      await storage.createPurchase(user.id, session.id, 1400);
      res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
      console.error("Checkout session error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });
  app2.post("/webhooks/stripe", async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!stripeSecretKey) {
        return res.status(500).json({ error: "Stripe not configured" });
      }
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeSecretKey);
      let event;
      if (webhookSecret) {
        const sig = req.headers["stripe-signature"];
        try {
          event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            webhookSecret
          );
        } catch (err) {
          console.error("Webhook signature verification failed:", err);
          return res.status(400).json({ error: "Invalid signature" });
        }
      } else {
        event = req.body;
      }
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
          await storage.updatePurchaseStatus(
            session.id,
            "completed",
            session.customer
          );
          await storage.updateUserPremium(userId, true);
          console.log(`User ${userId} upgraded to premium`);
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app2.post("/api/verify-purchase", authMiddleware, async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ error: "Stripe not configured" });
      }
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeSecretKey);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid" && session.metadata?.userId === req.user.id) {
        await storage.updateUserPremium(req.user.id, true);
        await storage.updatePurchaseStatus(sessionId, "completed", session.customer);
        res.json({ success: true, isPremium: true });
      } else {
        res.json({ success: false, isPremium: false });
      }
    } catch (error) {
      console.error("Verify purchase error:", error);
      res.status(500).json({ error: "Failed to verify purchase" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  let templatePath = path.resolve(__dirname, "templates", "landing-page.html");
  if (!fs.existsSync(templatePath)) {
    templatePath = path.resolve(process.cwd(), "server", "templates", "landing-page.html");
  }
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
