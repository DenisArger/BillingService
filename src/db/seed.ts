import { db } from "./client";
import { plans } from "./schema";

async function seed() {
  console.log("Seeding database...");

  // Create sample plans
  await db.insert(plans).values([
    {
      name: "Basic",
      price: "999.00",
      billingPeriod: "month",
      isActive: true,
    },
    {
      name: "Pro",
      price: "2999.00",
      billingPeriod: "month",
      isActive: true,
    },
    {
      name: "Enterprise",
      price: "29990.00",
      billingPeriod: "year",
      isActive: true,
    },
  ]);

  console.log("Seeding completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
