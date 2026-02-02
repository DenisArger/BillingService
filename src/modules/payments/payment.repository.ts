import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { payments, type NewPayment, type Payment } from "../../db/schema";

export class PaymentRepository {
  async findById(id: string): Promise<Payment | null> {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findByProviderPaymentId(
    providerPaymentId: string,
  ): Promise<Payment | null> {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.providerPaymentId, providerPaymentId))
      .limit(1);
    return result[0] || null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Payment | null> {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, idempotencyKey))
      .limit(1);
    return result[0] || null;
  }

  async create(data: NewPayment): Promise<Payment> {
    const result = await db.insert(payments).values(data).returning();
    return result[0];
  }

  async updateStatus(
    id: string,
    status: "pending" | "succeeded" | "failed" | "refunded",
  ): Promise<Payment> {
    const result = await db
      .update(payments)
      .set({ status })
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  async updateProviderPaymentId(
    id: string,
    providerPaymentId: string,
  ): Promise<Payment> {
    const result = await db
      .update(payments)
      .set({ providerPaymentId })
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }
}

export const paymentRepository = new PaymentRepository();
