import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import {
  paymentEvents,
  type NewPaymentEvent,
  type PaymentEvent,
} from "../../db/schema";

export class PaymentEventRepository {
  async findByProviderEventId(
    providerEventId: string,
  ): Promise<PaymentEvent | null> {
    const result = await db
      .select()
      .from(paymentEvents)
      .where(eq(paymentEvents.providerEventId, providerEventId))
      .limit(1);
    return result[0] || null;
  }

  async create(data: NewPaymentEvent): Promise<PaymentEvent> {
    try {
      const result = await db.insert(paymentEvents).values(data).returning();
      return result[0];
    } catch (error: any) {
      // If unique constraint violation on provider_event_id, it's a duplicate webhook
      if (
        error.code === "23505" &&
        error.constraint === "payment_events_provider_event_id_unique"
      ) {
        // Fetch and return the existing event
        const existing = await this.findByProviderEventId(data.providerEventId);
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }
}

export const paymentEventRepository = new PaymentEventRepository();
