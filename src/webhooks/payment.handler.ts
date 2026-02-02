import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { config } from "../config";
import { paymentRepository } from "../modules/payments/payment.repository";
import { paymentEventRepository } from "../modules/payments/payment-event.repository";
import { subscriptionService } from "../modules/subscriptions/subscription.service";

// Webhook payload schema
const webhookPayloadSchema = z.object({
  event_id: z.string(),
  event_type: z.enum([
    "payment.succeeded",
    "payment.failed",
    "payment.pending",
  ]),
  payment: z.object({
    provider_payment_id: z.string(),
    status: z.enum(["pending", "succeeded", "failed", "refunded"]),
    amount: z.string(),
    currency: z.string(),
  }),
  timestamp: z.string(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

export class PaymentWebhookHandler {
  /**
   * Verify webhook signature using HMAC-SHA256
   */
  verifySignature(rawBody: string, signature: string): boolean {
    const expectedSignature = createHmac("sha256", config.webhookSecret)
      .update(rawBody)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    return timingSafeEqual(signatureBuffer, expectedBuffer);
  }

  /**
   * Handle incoming webhook from payment provider
   */
  async handle(rawBody: string, signature: string): Promise<void> {
    // Verify signature
    if (!this.verifySignature(rawBody, signature)) {
      throw new Error("Invalid webhook signature");
    }

    // Parse and validate payload
    let payload: WebhookPayload;
    try {
      const parsed = JSON.parse(rawBody);
      payload = webhookPayloadSchema.parse(parsed);
    } catch (error) {
      throw new Error("Invalid webhook payload");
    }

    // Check for duplicate webhook (idempotency)
    const existingEvent = await paymentEventRepository.findByProviderEventId(
      payload.event_id,
    );
    if (existingEvent) {
      // Already processed, return success
      console.log(`Webhook ${payload.event_id} already processed`);
      return;
    }

    // Find payment by provider payment ID
    const payment = await paymentRepository.findByProviderPaymentId(
      payload.payment.provider_payment_id,
    );

    if (!payment) {
      throw new Error(
        `Payment not found: ${payload.payment.provider_payment_id}`,
      );
    }

    // Store webhook event (for audit trail)
    await paymentEventRepository.create({
      paymentId: payment.id,
      providerEventId: payload.event_id,
      eventType: payload.event_type,
      payload: payload as any,
    });

    // Update payment status based on event type
    const newStatus = payload.payment.status;
    if (newStatus !== payment.status) {
      await paymentRepository.updateStatus(payment.id, newStatus);

      // If payment succeeded, activate/extend subscription
      if (newStatus === "succeeded") {
        try {
          await subscriptionService.activateForPayment(payment.id);
          console.log(`Subscription activated for payment ${payment.id}`);
        } catch (error) {
          console.error("Failed to activate subscription:", error);
          // Don't throw - webhook should still return 200
          // This can be retried via reconciliation job
        }
      }
    }

    console.log(`Webhook ${payload.event_id} processed successfully`);
  }
}

export const paymentWebhookHandler = new PaymentWebhookHandler();
