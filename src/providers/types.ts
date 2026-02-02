export interface CreatePaymentParams {
  amount: string;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentResult {
  providerPaymentId: string;
  amount: string;
  currency: string;
  confirmationUrl: string;
  status: "pending" | "succeeded" | "failed";
}

export interface PaymentStatus {
  providerPaymentId: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  amount: string;
  currency: string;
}

export interface RefundResult {
  providerPaymentId: string;
  refundId: string;
  status: "refunded";
}

export interface IPaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  getStatus(providerPaymentId: string): Promise<PaymentStatus>;
  refund(providerPaymentId: string): Promise<RefundResult>;
}
