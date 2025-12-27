import {
  users,
  sessions,
  brainDumps,
  favorites,
  resets,
  scores,
  purchases,
  type User,
  type InsertUser,
  type Session,
  type BrainDump,
  type Favorite,
  type Reset,
  type Score,
  type Purchase,
} from "./shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPremium(userId: string, isPremium: boolean): Promise<void>;
  incrementBrainDumpCount(userId: string): Promise<void>;
  incrementResetCount(userId: string): Promise<void>;

  createSession(userId: string, token: string, expiresAt: Date): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;

  createBrainDump(
    userId: string,
    input: string,
    today: string[],
    canWait: string[],
    delegate: string[],
    ignore: string[]
  ): Promise<BrainDump>;
  getBrainDumps(userId: string): Promise<BrainDump[]>;

  createFavorite(userId: string, type: string, category: string | null, content: string): Promise<Favorite>;
  getFavorites(userId: string): Promise<Favorite[]>;
  deleteFavorite(id: string, userId: string): Promise<void>;

  createReset(userId: string): Promise<Reset>;
  getResets(userId: string): Promise<Reset[]>;
  getResetCount(userId: string): Promise<number>;

  createScore(userId: string, score: number, answers: number[]): Promise<Score>;
  getScores(userId: string): Promise<Score[]>;

  createPurchase(
    userId: string,
    stripeSessionId: string,
    amount: number
  ): Promise<Purchase>;
  getPurchaseBySessionId(stripeSessionId: string): Promise<Purchase | undefined>;
  updatePurchaseStatus(
    stripeSessionId: string,
    status: string,
    customerId?: string
  ): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPremium(userId: string, isPremium: boolean): Promise<void> {
    await db.update(users).set({ isPremium }).where(eq(users.id, userId));
  }

  async incrementBrainDumpCount(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await db
        .update(users)
        .set({ brainDumpCount: user.brainDumpCount + 1 })
        .where(eq(users.id, userId));
    }
  }

  async incrementResetCount(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await db
        .update(users)
        .set({ resetCount: user.resetCount + 1 })
        .where(eq(users.id, userId));
    }
  }

  async createSession(userId: string, token: string, expiresAt: Date): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({ userId, token, expiresAt })
      .returning();
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    return session || undefined;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async createBrainDump(
    userId: string,
    input: string,
    today: string[],
    canWait: string[],
    delegate: string[],
    ignore: string[]
  ): Promise<BrainDump> {
    const [brainDump] = await db
      .insert(brainDumps)
      .values({ userId, input, today, canWait, delegate, ignore })
      .returning();
    return brainDump;
  }

  async getBrainDumps(userId: string): Promise<BrainDump[]> {
    return db
      .select()
      .from(brainDumps)
      .where(eq(brainDumps.userId, userId))
      .orderBy(desc(brainDumps.createdAt));
  }

  async createFavorite(
    userId: string,
    type: string,
    category: string | null,
    content: string
  ): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values({ userId, type, category, content })
      .returning();
    return favorite;
  }

  async getFavorites(userId: string): Promise<Favorite[]> {
    return db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
  }

  async deleteFavorite(id: string, userId: string): Promise<void> {
    await db
      .delete(favorites)
      .where(eq(favorites.id, id));
  }

  async createReset(userId: string): Promise<Reset> {
    const [reset] = await db.insert(resets).values({ userId }).returning();
    return reset;
  }

  async getResets(userId: string): Promise<Reset[]> {
    return db
      .select()
      .from(resets)
      .where(eq(resets.userId, userId))
      .orderBy(desc(resets.completedAt));
  }

  async getResetCount(userId: string): Promise<number> {
    const userResets = await this.getResets(userId);
    return userResets.length;
  }

  async createScore(userId: string, score: number, answers: number[]): Promise<Score> {
    const [scoreRecord] = await db
      .insert(scores)
      .values({ userId, score, answers })
      .returning();
    return scoreRecord;
  }

  async getScores(userId: string): Promise<Score[]> {
    return db
      .select()
      .from(scores)
      .where(eq(scores.userId, userId))
      .orderBy(desc(scores.createdAt));
  }

  async createPurchase(
    userId: string,
    stripeSessionId: string,
    amount: number
  ): Promise<Purchase> {
    const [purchase] = await db
      .insert(purchases)
      .values({ userId, stripeSessionId, amount })
      .returning();
    return purchase;
  }

  async getPurchaseBySessionId(stripeSessionId: string): Promise<Purchase | undefined> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.stripeSessionId, stripeSessionId));
    return purchase || undefined;
  }

  async updatePurchaseStatus(
    stripeSessionId: string,
    status: string,
    customerId?: string
  ): Promise<void> {
    const updateData: { status: string; stripeCustomerId?: string } = { status };
    if (customerId) {
      updateData.stripeCustomerId = customerId;
    }
    await db
      .update(purchases)
      .set(updateData)
      .where(eq(purchases.stripeSessionId, stripeSessionId));
  }
}

export const storage = new DatabaseStorage();
