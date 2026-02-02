import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  webhookSecret: process.env.WEBHOOK_SECRET || "",
  paymentProviderBaseUrl: process.env.PAYMENT_PROVIDER_BASE_URL || "",
};
