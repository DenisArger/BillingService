# API Examples

## Prerequisites

1. Database running with migrations applied
2. Server running on port 3000
3. Sample plans seeded (run seed script if needed)

## 1. Health Check

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "status": "ok"
}
```

## 2. Create Payment

```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "planId": "650e8400-e29b-41d4-a716-446655440000",
    "idempotencyKey": "payment-2024-001"
  }'
```

Response (201 Created):

```json
{
  "id": "750e8400-e29b-41d4-a716-446655440000",
  "confirmationUrl": "http://localhost:3000/mock-provider/confirm?payment_id=mock_abc123",
  "amount": "999.00",
  "currency": "RUB",
  "status": "pending"
}
```

## 3. Get Payment Status

```bash
curl http://localhost:3000/payments/750e8400-e29b-41d4-a716-446655440000
```

Response (200 OK):

```json
{
  "id": "750e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "amount": "999.00",
  "currency": "RUB",
  "createdAt": "2024-01-30T12:00:00.000Z"
}
```

## 4. Simulate Payment Webhook (Success)

Generate signature and payload:

```bash
tsx src/utils/webhook-test.ts
```

Or manually:

```bash
curl -X POST http://localhost:3000/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: YOUR_SIGNATURE_HERE" \
  -d '{
    "event_id": "evt_test_123",
    "event_type": "payment.succeeded",
    "payment": {
      "provider_payment_id": "mock_abc123",
      "status": "succeeded",
      "amount": "999.00",
      "currency": "RUB"
    },
    "timestamp": "2024-01-30T12:00:00.000Z"
  }'
```

Response (200 OK):

```json
{
  "received": true
}
```

After webhook, check payment status again - it should be "succeeded" and subscription should be active.

## 5. Refund Payment

```bash
curl -X POST http://localhost:3000/payments/750e8400-e29b-41d4-a716-446655440000/refund \
  -H "Content-Type: application/json"
```

Response (200 OK):

```json
{
  "message": "Payment refunded successfully"
}
```

## Idempotency Testing

Create payment with same idempotency key:

```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "planId": "650e8400-e29b-41d4-a716-446655440000",
    "idempotencyKey": "payment-2024-001"
  }'
```

Response (200 OK) - returns existing payment instead of creating new one.

## Error Cases

### Invalid payment ID (404):

```bash
curl http://localhost:3000/payments/invalid-id
```

### Refund non-succeeded payment (409):

```bash
curl -X POST http://localhost:3000/payments/PENDING_PAYMENT_ID/refund
```

### Missing required fields (400):

```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{"userId": "invalid"}'
```
