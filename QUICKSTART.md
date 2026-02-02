# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

```bash
# Create PostgreSQL database
createdb billing_db

# Configure environment
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Run Migrations

```bash
npm run db:generate  # Generate migration files from schema
npm run db:migrate   # Apply migrations to database
npm run db:seed      # (Optional) Add sample plans
```

### 4. Start Server

```bash
npm run dev
```

Server runs at http://localhost:3000

### 5. Test API

```bash
# Health check
curl http://localhost:3000/health

# Create payment (use actual UUIDs from your database)
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_UUID",
    "planId": "YOUR_PLAN_UUID",
    "idempotencyKey": "unique-key-123"
  }'
```

## Project Structure Summary

```
src/
├── index.ts              # Entry point
├── app.ts                # Express setup
├── routes.ts             # API routes
├── config.ts             # Configuration
├── db/                   # Database layer
│   ├── schema.ts         # Tables definition
│   ├── client.ts         # DB connection
│   ├── migrate.ts        # Migration runner
│   └── seed.ts           # Sample data
├── modules/              # Business logic
│   ├── payments/         # Payment processing
│   ├── subscriptions/    # Subscription management
│   └── users/            # User & plan repos
├── providers/            # Payment gateway
│   ├── types.ts          # Interfaces
│   └── paymentProvider.mock.ts
└── webhooks/             # Webhook handling
    ├── payment.handler.ts
    └── webhook.controller.ts
```

## Key Features Implemented

✅ Database schema with 5 tables (users, plans, subscriptions, payments, payment_events)  
✅ Idempotent payment creation  
✅ Mock payment provider  
✅ Webhook processing with signature verification  
✅ Automatic subscription activation  
✅ Payment refunds  
✅ Audit trail (payment_events)

## API Endpoints

- `POST /payments` - Create payment
- `GET /payments/:id` - Get payment status
- `POST /payments/:id/refund` - Refund payment
- `POST /webhooks/payment` - Receive provider webhook
- `GET /health` - Health check

## Testing Webhooks

Generate test webhook with signature:

```bash
tsx src/utils/webhook-test.ts
```

This outputs a curl command you can use to test webhook processing.

## Documentation

- [README_IMPLEMENTATION.md](./README_IMPLEMENTATION.md) - Full implementation guide
- [API_EXAMPLES.md](./API_EXAMPLES.md) - Detailed API examples
- [Readme.md](./Readme.md) - Original task specification

## Common Issues

**Database connection error**: Check DATABASE_URL in .env  
**Migration fails**: Ensure database exists and is accessible  
**Port already in use**: Change PORT in .env

## Next Steps

1. Review the code structure
2. Understand the payment flow (see README_IMPLEMENTATION.md)
3. Test the API endpoints (see API_EXAMPLES.md)
4. Examine webhook signature verification
5. Review idempotency implementation
