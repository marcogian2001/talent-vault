import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { chefReviews } from "@/db/schema";

export type ChefReview = typeof chefReviews.$inferSelect;
export type ReviewStatus = "pending" | "approved" | "rejected";

/**
 * Where a chef stands overall. `incomplete` is derived from the questionnaire, the rest from
 * the review row; no row means the chef finished onboarding and nobody has looked yet.
 */
export type ChefStage = "incomplete" | ReviewStatus;

export function resolveStage(isComplete: boolean, review: ChefReview | undefined): ChefStage {
  if (!isComplete) return "incomplete";
  return (review?.status as ReviewStatus | undefined) ?? "pending";
}

export async function getReview(userId: string): Promise<ChefReview | undefined> {
  const [row] = await db.select().from(chefReviews).where(eq(chefReviews.userId, userId)).limit(1);
  return row;
}

/** Batched version for the admin chef list: one query regardless of the page size. */
export async function getReviewsForUsers(userIds: string[]): Promise<Map<string, ChefReview>> {
  if (userIds.length === 0) return new Map();
  const rows = await db.select().from(chefReviews).where(inArray(chefReviews.userId, userIds));
  return new Map(rows.map((row) => [row.userId, row]));
}

export async function approveChef(userId: string, adminId: string) {
  const now = new Date();
  const values = {
    status: "approved",
    rejectionReason: null,
    flaggedQuestionIds: null,
    reviewedByUserId: adminId,
    reviewedAt: now,
    updatedAt: now,
  };

  await db
    .insert(chefReviews)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: chefReviews.userId, set: values });
}

export async function rejectChef(
  userId: string,
  adminId: string,
  reason: string,
  flaggedQuestionIds: string[],
) {
  const now = new Date();
  const values = {
    status: "rejected",
    rejectionReason: reason,
    flaggedQuestionIds,
    reviewedByUserId: adminId,
    reviewedAt: now,
    updatedAt: now,
  };

  await db
    .insert(chefReviews)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: chefReviews.userId, set: values });
}

/**
 * Sends a rejected chef back into the queue. The reason and the flagged questions stay on the
 * row so the admin who picks it up again can see what was asked for last time.
 */
export async function resubmitChef(userId: string) {
  const now = new Date();
  await db
    .update(chefReviews)
    .set({ status: "pending", resubmittedAt: now, updatedAt: now })
    .where(eq(chefReviews.userId, userId));
}
