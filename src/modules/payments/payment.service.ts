import { paymentRepository } from "./payment.repository";
import { planRepository } from "../users/plan.repository";
import { subscriptionRepository } from "../subscriptions/subscription.repository";
import { mockPaymentProvider } from "../../providers/paymentProvider.mock";
import type { Payment } from "../../db/schema";

export interface CreatePaymentDto {
  userId: string;
  planId: string;
  subscriptionId?: string;
  idempotencyKey: string;
}

export interface PaymentMetadata {
  paymentId: string;
  userId: string;
  planId: string;
  subscriptionId?: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  confirmationUrl: string;
  amount: string;
  currency: string;
  status: string;
  isExisting?: boolean;
}

export interface PaymentDto {
  id: string;
  status: string;
  amount: string;
  currency: string;
  createdAt: Date;
}

export class PaymentService {
  async createPayment(dto: CreatePaymentDto): Promise<CreatePaymentResult> {
    // Check idempotency - if payment already exists, return it
    const existingPayment = await paymentRepository.findByIdempotencyKey(
      dto.idempotencyKey,
    );
    if (existingPayment) {
      return {
        paymentId: existingPayment.id,
        confirmationUrl: "", // Already processed
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        status: existingPayment.status,
        isExisting: true,
      };
    }

    // Validate plan exists
    const plan = await planRepository.findById(dto.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    if (!plan.isActive) {
      throw new Error("Plan is not active");
    }

    // Determine subscription
    let subscriptionId = dto.subscriptionId;
    if (!subscriptionId) {
      // Check if user already has active subscription
      const activeSubscription =
        await subscriptionRepository.findActiveByUserId(dto.userId);
      if (activeSubscription) {
        subscriptionId = activeSubscription.id;
      }
    }

    // Create payment record with pending status
    const payment = await paymentRepository.create({
      userId: dto.userId,
      subscriptionId: subscriptionId || null,
      planId: dto.planId,
      provider: "mock",
      amount: plan.price,
      currency: "RUB",
      status: "pending",
      idempotencyKey: dto.idempotencyKey,
    });

    // Call payment provider to create payment
    try {
      const providerResult = await mockPaymentProvider.createPayment({
        amount: plan.price,
        currency: "RUB",
        description: `Payment for ${plan.name} plan`,
        metadata: {
          paymentId: payment.id,
          userId: dto.userId,
          planId: dto.planId,
        },
      });

      // Update payment with provider payment ID
      await paymentRepository.updateProviderPaymentId(
        payment.id,
        providerResult.providerPaymentId,
      );

      return {
        paymentId: payment.id,
        confirmationUrl: providerResult.confirmationUrl,
        amount: providerResult.amount,
        currency: providerResult.currency,
        status: providerResult.status,
      };
    } catch (error) {
      // If provider fails, payment remains in pending state
      console.error("Payment provider error:", error);
      throw new Error("Payment provider unavailable");
    }
  }

  async getPayment(paymentId: string): Promise<PaymentDto | null> {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt,
    };
  }

  async refundPayment(paymentId: string): Promise<void> {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "succeeded") {
      throw new Error(`Cannot refund payment with status ${payment.status}`);
    }

    if (!payment.providerPaymentId) {
      throw new Error("Payment has no provider payment ID");
    }

    // Call provider to refund
    try {
      await mockPaymentProvider.refund(payment.providerPaymentId);

      // Update payment status
      await paymentRepository.updateStatus(paymentId, "refunded");
    } catch (error) {
      console.error("Refund error:", error);
      throw new Error("Refund failed");
    }
  }
}

export const paymentService = new PaymentService();
