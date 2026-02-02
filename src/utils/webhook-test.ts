import { createHmac } from "crypto";

/**
 * Utility to generate webhook signature for testing
 * Usage: tsx src/utils/webhook-test.ts
 */

const WEBHOOK_SECRET =
  process.env.WEBHOOK_SECRET ||
  "your-secret-key-for-webhook-signature-validation";

const examplePayload = {
  event_id: "evt_test_123",
  event_type: "payment.succeeded",
  payment: {
    provider_payment_id: "mock_abc123",
    status: "succeeded",
    amount: "999.00",
    currency: "RUB",
  },
  timestamp: new Date().toISOString(),
};

const rawBody = JSON.stringify(examplePayload);
const signature = createHmac("sha256", WEBHOOK_SECRET)
  .update(rawBody)
  .digest("hex");

console.log("Example webhook payload:");
console.log(rawBody);
console.log("\nSignature (X-Webhook-Signature header):");
console.log(signature);
console.log("\nCurl command:");
console.log(`curl -X POST http://localhost:3000/webhooks/payment \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: ${signature}" \\
  -d '${rawBody}'`);
