import { Router } from "express";
import { paymentController } from "./modules/payments/payment.controller";
import { webhookController } from "./webhooks/webhook.controller";

const router = Router();

// Payment routes
router.post("/payments", (req, res) =>
  paymentController.createPayment(req, res),
);
router.get("/payments/:id", (req, res) =>
  paymentController.getPayment(req, res),
);
router.post("/payments/:id/refund", (req, res) =>
  paymentController.refundPayment(req, res),
);

// Webhook routes
router.post("/webhooks/payment", (req, res) =>
  webhookController.handlePaymentWebhook(req, res),
);

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default router;
