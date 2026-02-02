import { subscriptionRepository } from "./subscription.repository";
import { paymentRepository } from "../payments/payment.repository";
import { planRepository } from "../users/plan.repository";

export class SubscriptionService {
  /**
   * Activate or extend subscription after successful payment
   */
  async activateForPayment(paymentId: string): Promise<void> {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "succeeded") {
      throw new Error("Payment is not succeeded");
    }

    // Get plan from payment
    const plan = await planRepository.findById(payment.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    // Check if subscription already exists
    let subscription = payment.subscriptionId
      ? await subscriptionRepository.findById(payment.subscriptionId)
      : null;

    const now = new Date();
    const newExpires = new Date(now);

    if (plan.billingPeriod === "month") {
      newExpires.setMonth(newExpires.getMonth() + 1);
    } else {
      newExpires.setFullYear(newExpires.getFullYear() + 1);
    }

    if (!subscription) {
      // Create new subscription
      subscription = await subscriptionRepository.create({
        userId: payment.userId,
        planId: payment.planId,
        status: "active",
        startedAt: now,
        expiresAt: newExpires,
      });

      // Update payment with subscription ID
      // Note: This would require adding a method to payment repository
      // For now, the subscription is created without linking back
    } else {
      // Extend existing subscription
      const currentExpires = new Date(subscription.expiresAt);
      const startFrom = currentExpires > now ? currentExpires : now;

      const extendedExpires = new Date(startFrom);
      if (plan.billingPeriod === "month") {
        extendedExpires.setMonth(extendedExpires.getMonth() + 1);
      } else {
        extendedExpires.setFullYear(extendedExpires.getFullYear() + 1);
      }

      await subscriptionRepository.updateExpires(
        subscription.id,
        extendedExpires,
      );
      await subscriptionRepository.updateStatus(subscription.id, "active");
    }
  }
}

export const subscriptionService = new SubscriptionService();
