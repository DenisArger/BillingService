import { eq, and } from "drizzle-orm";
import { db } from "../../db/client";
import {
  subscriptions,
  type NewSubscription,
  type Subscription,
} from "../../db/schema";

export class SubscriptionRepository {
  async findById(id: string): Promise<Subscription | null> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
        ),
      )
      .limit(1);
    return result[0] || null;
  }

  async create(data: NewSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(data).returning();
    return result[0];
  }

  async updateStatus(
    id: string,
    status: "active" | "canceled" | "expired",
  ): Promise<Subscription> {
    const result = await db
      .update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, id))
      .returning();
    return result[0];
  }

  async updateExpires(id: string, expiresAt: Date): Promise<Subscription> {
    const result = await db
      .update(subscriptions)
      .set({ expiresAt })
      .where(eq(subscriptions.id, id))
      .returning();
    return result[0];
  }
}

export const subscriptionRepository = new SubscriptionRepository();
