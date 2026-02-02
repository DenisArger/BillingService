import { Request, Response } from "express";
import { paymentWebhookHandler } from "./payment.handler";

export class WebhookController {
  /**
   * POST /webhooks/payment - Handle payment webhook
   */
  async handlePaymentWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Get raw body and signature from request
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const signature = req.headers["x-webhook-signature"] as string;

      if (!signature) {
        console.error("Missing webhook signature");
        // Return 200 to prevent provider retries for invalid requests
        res.status(200).json({ received: true });
        return;
      }

      // Handle webhook
      await paymentWebhookHandler.handle(rawBody, signature);

      // Always return 200 to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error: any) {
      // Log error but still return 200 to prevent retries
      console.error("Webhook processing error:", error.message);
      res.status(200).json({ received: true });
    }
  }
}

export const webhookController = new WebhookController();
