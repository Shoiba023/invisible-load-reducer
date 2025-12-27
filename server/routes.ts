import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const FREE_BRAIN_DUMP_LIMIT = 2;
const FREE_RESET_LIMIT = 1;
const BCRYPT_ROUNDS = 12;
const JWT_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRY = "30d";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isPremium: boolean;
    brainDumpCount: number;
    resetCount: number;
  };
}

interface JWTPayload {
  userId: string;
  email: string;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email } as JWTPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
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
    resetCount: user.resetCount,
  };

  next();
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 20;

function rateLimitMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
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

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/auth/signup", async (req, res) => {
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
          resetCount: user.resetCount,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
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
          resetCount: user.resetCount,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (_req: AuthRequest, res) => {
    res.json({ success: true });
  });

  app.get("/api/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const resetCount = await storage.getResetCount(user.id);

      res.json({
        id: user.id,
        email: user.email,
        isPremium: user.isPremium,
        brainDumpCount: user.brainDumpCount,
        resetCount: resetCount,
        canUseBrainDump: user.isPremium || user.brainDumpCount < FREE_BRAIN_DUMP_LIMIT,
        canUseReset: user.isPremium || resetCount < FREE_RESET_LIMIT,
        remainingBrainDumps: user.isPremium ? -1 : FREE_BRAIN_DUMP_LIMIT - user.brainDumpCount,
        remainingResets: user.isPremium ? -1 : FREE_RESET_LIMIT - resetCount,
      });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  app.post(
    "/api/brain-dump",
    authMiddleware,
    rateLimitMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const { input } = req.body;

        if (!input || input.trim().length === 0) {
          return res.status(400).json({ error: "Input is required" });
        }

        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (!user.isPremium && user.brainDumpCount >= FREE_BRAIN_DUMP_LIMIT) {
          return res.status(403).json({
            error: "Free brain dump limit reached",
            requiresPremium: true,
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
            { role: "user", content: input },
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1024,
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
          ignore: parsed.ignore || [],
        });
      } catch (error) {
        console.error("Brain dump error:", error);
        res.status(500).json({ error: "Failed to process brain dump" });
      }
    }
  );

  app.get("/api/brain-dump/history", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const brainDumps = await storage.getBrainDumps(req.user!.id);
      res.json(brainDumps);
    } catch (error) {
      console.error("Get brain dumps error:", error);
      res.status(500).json({ error: "Failed to get brain dump history" });
    }
  });

  app.post(
    "/api/scripts",
    authMiddleware,
    rateLimitMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const { category, situation } = req.body;

        if (!category) {
          return res.status(400).json({ error: "Category is required" });
        }

        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (!user.isPremium) {
          return res.status(403).json({
            error: "Scripts require premium",
            requiresPremium: true,
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
            { role: "user", content: `Generate scripts for talking to my ${category}` },
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1024,
        });

        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);

        res.json({
          category,
          shortScripts: parsed.shortScripts || [],
          longScripts: parsed.longScripts || [],
        });
      } catch (error) {
        console.error("Scripts error:", error);
        res.status(500).json({ error: "Failed to generate scripts" });
      }
    }
  );

  app.post("/api/reset", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const resetCount = await storage.getResetCount(user.id);

      if (!user.isPremium && resetCount >= FREE_RESET_LIMIT) {
        return res.status(403).json({
          error: "Free reset limit reached",
          requiresPremium: true,
        });
      }

      const reset = await storage.createReset(user.id);
      await storage.incrementResetCount(user.id);

      res.json({
        id: reset.id,
        completedAt: reset.completedAt,
        totalResets: resetCount + 1,
      });
    } catch (error) {
      console.error("Reset error:", error);
      res.status(500).json({ error: "Failed to record reset" });
    }
  });

  app.get("/api/reset/count", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const count = await storage.getResetCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error("Get reset count error:", error);
      res.status(500).json({ error: "Failed to get reset count" });
    }
  });

  app.post(
    "/api/score",
    authMiddleware,
    rateLimitMiddleware,
    async (req: AuthRequest, res) => {
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

        const totalScore = answers.reduce((sum: number, a: number) => sum + a, 0);
        const maxScore = 50;
        const percentage = Math.round((totalScore / maxScore) * 100);

        const avgLoadPercentage = 42;
        const comparison = percentage - avgLoadPercentage;

        const score = await storage.createScore(req.user!.id, percentage, answers);

        res.json({
          id: score.id,
          score: percentage,
          comparison: comparison > 0 ? `+${comparison}` : `${comparison}`,
          message:
            comparison > 0
              ? `You're carrying ${comparison}% more load than average`
              : comparison < 0
              ? `You're carrying ${Math.abs(comparison)}% less load than average`
              : "You're carrying an average mental load",
        });
      } catch (error) {
        console.error("Score error:", error);
        res.status(500).json({ error: "Failed to calculate score" });
      }
    }
  );

  app.get("/api/score/history", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user?.isPremium) {
        return res.status(403).json({
          error: "Quiz history requires premium",
          requiresPremium: true,
        });
      }

      const scores = await storage.getScores(req.user!.id);
      res.json(scores);
    } catch (error) {
      console.error("Get scores error:", error);
      res.status(500).json({ error: "Failed to get score history" });
    }
  });

  app.post("/api/favorites", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user?.isPremium) {
        return res.status(403).json({
          error: "Favorites require premium",
          requiresPremium: true,
        });
      }

      const { type, category, content } = req.body;

      if (!type || !content) {
        return res.status(400).json({ error: "Type and content required" });
      }

      const favorite = await storage.createFavorite(
        req.user!.id,
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

  app.get("/api/favorites", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user?.isPremium) {
        return res.status(403).json({
          error: "Favorites require premium",
          requiresPremium: true,
        });
      }

      const favorites = await storage.getFavorites(req.user!.id);
      res.json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ error: "Failed to get favorites" });
    }
  });

  app.delete("/api/favorites/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      await storage.deleteFavorite(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete favorite error:", error);
      res.status(500).json({ error: "Failed to delete favorite" });
    }
  });

  app.post("/api/purchases/checkout-session", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeSecretKey);

      const user = await storage.getUser(req.user!.id);
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
                description: "Unlimited access to all features. One-time purchase.",
              },
              unit_amount: 1400,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/payment-cancelled`,
        customer_email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      await storage.createPurchase(user.id, session.id, 1400);

      res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
      console.error("Checkout session error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/webhooks/stripe", async (req, res) => {
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
        const sig = req.headers["stripe-signature"] as string;
        try {
          event = stripe.webhooks.constructEvent(
            req.rawBody as Buffer,
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
            session.customer as string
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

  app.post("/api/verify-purchase", authMiddleware, async (req: AuthRequest, res) => {
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

      if (session.payment_status === "paid" && session.metadata?.userId === req.user!.id) {
        await storage.updateUserPremium(req.user!.id, true);
        await storage.updatePurchaseStatus(sessionId, "completed", session.customer as string);

        res.json({ success: true, isPremium: true });
      } else {
        res.json({ success: false, isPremium: false });
      }
    } catch (error) {
      console.error("Verify purchase error:", error);
      res.status(500).json({ error: "Failed to verify purchase" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
