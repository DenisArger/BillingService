import { Request, Response } from "express";
import { z } from "zod";
import { paymentService } from "./payment.service";

// Validation schemas
const createPaymentSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  idempotencyKey: z.string().min(1),
});

export class PaymentController {
  /**
   * POST /payments - Create a new payment
   */
  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = createPaymentSchema.parse(req.body);

      // Create payment
      const result = await paymentService.createPayment(validatedData);

      // Return 200 if idempotent repeat, 201 if new payment
      const statusCode = result.isExisting ? 200 : 201;
      res.status(statusCode).json({
        id: result.paymentId,
        confirmationUrl: result.confirmationUrl,
        amount: result.amount,
        currency: result.currency,
        status: result.status,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation error",
          details: error.errors,
        });
        return;
      }

      console.error("Create payment error:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * GET /payments/:id - Get payment status
   */
  async getPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const payment = await paymentService.getPayment(id);
      if (!payment) {
        res.status(404).json({ error: "Payment not found" });
        return;
      }

      res.status(200).json(payment);
    } catch (error: any) {
      console.error("Get payment error:", error);
      res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * POST /payments/:id/refund - Refund a payment
   */
  async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await paymentService.refundPayment(id);

      res.status(200).json({
        message: "Payment refunded successfully",
      });
    } catch (error: any) {
      console.error("Refund payment error:", error);

      if (error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes("Cannot refund")) {
        res.status(409).json({ error: error.message });
        return;
      }

      res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  }
}

export const paymentController = new PaymentController();
