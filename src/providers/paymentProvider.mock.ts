import { randomUUID } from "crypto";
import { config } from "../config";
import {
  IPaymentProvider,
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentStatus,
  RefundResult,
} from "./types";

interface MockPayment {
  providerPaymentId: string;
  amount: string;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  createdAt: Date;
}

/**
 * Mock payment provider simulating a real payment gateway.
 * In-memory storage for demo purposes.
 */
export class MockPaymentProvider implements IPaymentProvider {
  private payments: Map<string, MockPayment> = new Map();

  async createPayment(
    params: CreatePaymentParams,
  ): Promise<CreatePaymentResult> {
    const providerPaymentId = `mock_${randomUUID()}`;

    const payment: MockPayment = {
      providerPaymentId,
      amount: params.amount,
      currency: params.currency,
      status: "pending",
      createdAt: new Date(),
    };

    this.payments.set(providerPaymentId, payment);

    // Generate confirmation URL that includes the payment ID
    // In real system, this would redirect to payment page
    const confirmationUrl = `${config.paymentProviderBaseUrl}/confirm?payment_id=${providerPaymentId}`;

    return {
      providerPaymentId,
      amount: params.amount,
      currency: params.currency,
      confirmationUrl,
      status: "pending",
    };
  }

  async getStatus(providerPaymentId: string): Promise<PaymentStatus> {
    const payment = this.payments.get(providerPaymentId);

    if (!payment) {
      throw new Error(`Payment ${providerPaymentId} not found`);
    }

    return {
      providerPaymentId: payment.providerPaymentId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
    };
  }

  async refund(providerPaymentId: string): Promise<RefundResult> {
    const payment = this.payments.get(providerPaymentId);

    if (!payment) {
      throw new Error(`Payment ${providerPaymentId} not found`);
    }

    if (payment.status !== "succeeded") {
      throw new Error(`Cannot refund payment with status ${payment.status}`);
    }

    payment.status = "refunded";
    this.payments.set(providerPaymentId, payment);

    return {
      providerPaymentId,
      refundId: `refund_${randomUUID()}`,
      status: "refunded",
    };
  }

  /**
   * Mock method to simulate successful payment (for testing).
   * In real provider, this would be triggered by user completing payment.
   */
  async simulatePaymentSuccess(providerPaymentId: string): Promise<void> {
    const payment = this.payments.get(providerPaymentId);
    if (payment && payment.status === "pending") {
      payment.status = "succeeded";
      this.payments.set(providerPaymentId, payment);
    }
  }

  /**
   * Mock method to simulate failed payment (for testing).
   */
  async simulatePaymentFailure(providerPaymentId: string): Promise<void> {
    const payment = this.payments.get(providerPaymentId);
    if (payment && payment.status === "pending") {
      payment.status = "failed";
      this.payments.set(providerPaymentId, payment);
    }
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
