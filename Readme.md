# Billing Service - Implementation Guide

## Overview

This project implements a billing service backend for a SaaS product using Node.js, TypeScript, Express, and PostgreSQL with Drizzle ORM.

## Architecture

The project follows a layered architecture:

- **Controller** - HTTP layer (Express routes and controllers)
- **Service** - Business logic (payment processing, subscriptions)
- **Repository** - Database access layer
- **Provider** - Payment gateway integration (mock implementation)

## Project Structure

```
src/
├── app.ts                      # Express application setup
├── index.ts                    # Entry point
├── config.ts                   # Configuration management
├── routes.ts                   # API routes
├── db/
│   ├── schema.ts              # Database schema (Drizzle)
│   ├── client.ts              # Database client
│   ├── migrate.ts             # Migration runner
│   ├── seed.ts                # Seed data
│   └── migrations/            # Migration files (generated)
├── modules/
│   ├── users/
│   │   ├── user.repository.ts
│   │   └── plan.repository.ts
│   ├── subscriptions/
│   │   ├── subscription.repository.ts
│   │   └── subscription.service.ts
│   └── payments/
│       ├── payment.repository.ts
│       ├── payment-event.repository.ts
│       ├── payment.service.ts
│       └── payment.controller.ts
├── providers/
│   ├── types.ts               # Payment provider interfaces
│   └── paymentProvider.mock.ts # Mock provider implementation
├── webhooks/
│   ├── payment.handler.ts     # Webhook processing logic
│   └── webhook.controller.ts  # Webhook HTTP handler
└── utils/
    └── webhook-test.ts        # Webhook signature generator
```

## Getting Started

### 1. Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### 2. Installation

```bash
# Clone repository
git clone <repository-url>
cd test-project-for-hh

# Install dependencies
npm install
```

### 3. Database Setup

Create PostgreSQL database:

```bash
createdb billing_db
```

Or using psql:

```sql
CREATE DATABASE billing_db;
```

### 4. Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/billing_db
PAYMENT_PROVIDER_BASE_URL=http://localhost:3000/mock-provider
WEBHOOK_SECRET=your-secret-key-for-webhook-signature-validation
```

### 5. Database Migration

Generate migrations (if schema changed):

```bash
npm run db:generate
```

Run migrations:

```bash
npm run db:migrate
```

Seed sample data (optional):

```bash
tsx src/db/seed.ts
```

### 6. Run Application

Development mode (with auto-reload):

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

The server will start on http://localhost:3000

## API Endpoints

### Payments

- `POST /payments` - Create a new payment
- `GET /payments/:id` - Get payment status
- `POST /payments/:id/refund` - Refund a payment

### Webhooks

- `POST /webhooks/payment` - Receive payment webhook from provider

### Health

- `GET /health` - Service health check

See [API_EXAMPLES.md](./API_EXAMPLES.md) for detailed usage examples.

## Database Schema

### Tables

1. **users** - SaaS users
2. **plans** - Subscription plans
3. **subscriptions** - User subscriptions
4. **payments** - Payment records
5. **payment_events** - Webhook events from payment provider

### Key Features

- UUID primary keys
- Unique constraints on `idempotency_key`, `provider_payment_id`, `provider_event_id`
- Foreign key relationships
- JSONB for flexible webhook payload storage

## Payment Flow

1. Client creates payment via `POST /payments`
2. Backend creates payment record with `pending` status
3. Backend calls payment provider (mock)
4. Provider returns confirmation URL
5. Client redirects user to confirmation URL
6. User completes payment (simulated in mock)
7. Provider sends webhook to `POST /webhooks/payment`
8. Webhook handler:
   - Verifies signature (HMAC-SHA256)
   - Checks idempotency (prevents duplicate processing)
   - Stores event in `payment_events`
   - Updates payment status
   - Activates/extends subscription if payment succeeded

## Mock Payment Provider

The mock provider simulates a real payment gateway:

- In-memory storage of payments
- Generates mock payment IDs
- Returns confirmation URLs
- Supports status checking and refunds
- Helper methods for testing (`simulatePaymentSuccess`, `simulatePaymentFailure`)

## Security Features

- **Idempotency**: Prevents duplicate payments via `idempotency_key`
- **Webhook Signature**: HMAC-SHA256 verification of webhook authenticity
- **No Card Data**: PCI DSS compliant - no card data stored
- **Audit Trail**: All webhook events logged in `payment_events`
- **Timing-Safe Comparison**: Prevents timing attacks on signature verification

## Error Handling

- Duplicate idempotency keys return existing payment (200)
- Duplicate webhooks are detected and ignored (200)
- Provider failures leave payment in `pending` state
- Refund validation prevents invalid operations (409)
- All errors logged, webhooks always return 200 to prevent retries

## Testing

### Manual Testing

1. Create a test user and plan (via database or seed script)
2. Create payment:

```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_UUID",
    "planId": "PLAN_UUID",
    "idempotencyKey": "test-payment-001"
  }'
```

3. Generate webhook signature:

```bash
tsx src/utils/webhook-test.ts
```

4. Send webhook with generated signature
5. Verify payment status changed to `succeeded`
6. Verify subscription created/extended

### Webhook Signature Generation

The `webhook-test.ts` utility generates valid webhook payloads and signatures for testing:

```bash
tsx src/utils/webhook-test.ts
```

This outputs:

- Example webhook JSON payload
- HMAC-SHA256 signature
- Complete curl command for testing

## Production Considerations

This is a demonstration project. For production, consider adding:

- **Retry Mechanisms**: Automatic retry for failed webhook processing
- **Reconciliation Jobs**: Periodic sync with provider to catch missed webhooks
- **Multiple Providers**: Support for different payment gateways
- **Monitoring**: Metrics, alerting, and logging infrastructure
- **Rate Limiting**: Protect API endpoints
- **Authentication**: User authentication and authorization
- **Testing**: Unit tests, integration tests, e2e tests
- **Database Pooling**: Connection pool configuration
- **Graceful Shutdown**: Proper cleanup on termination
- **Horizontal Scaling**: Session storage, distributed locks

## Development Notes

### Adding New Payment Status

1. Update `paymentStatusEnum` in `src/db/schema.ts`
2. Generate and run migration
3. Update `PaymentService` logic
4. Update webhook handler logic

### Adding New Provider

1. Implement `IPaymentProvider` interface
2. Add provider-specific configuration
3. Update `PaymentService` to use provider factory
4. Implement provider-specific webhook signature verification

### Database Migrations

When changing schema:

```bash
npm run db:generate  # Generate migration
npm run db:migrate   # Apply migration
```

## Troubleshooting

### Database connection fails

- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### Webhook signature fails

- Verify WEBHOOK_SECRET matches between .env and test script
- Check raw body is captured correctly
- Ensure signature is sent as `X-Webhook-Signature` header

### Payment stuck in pending

- Check mock provider logs
- Verify webhook was sent and received
- Check payment_events table for webhook records

## License

ISC
