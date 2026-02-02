import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { plans, type Plan } from "../../db/schema";

export class PlanRepository {
  async findById(id: string): Promise<Plan | null> {
    const result = await db
      .select()
      .from(plans)
      .where(eq(plans.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findActive(): Promise<Plan[]> {
    return await db.select().from(plans).where(eq(plans.isActive, true));
  }
}

export const planRepository = new PlanRepository();
