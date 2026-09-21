import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { applications, user } from "@/db/schema";
import { getReviewsForUsers, resolveStage } from "@/lib/chef-review";
import { getOnboardingStatusForUsers } from "@/lib/onboarding";
import ChefsTable, { type ChefRow } from "./ChefsTable";
import ChefsToolbar from "./ChefsToolbar";
import { PAGE_SIZE, parseChefsParams } from "./table-params";

export default async function AdminChefsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseChefsParams(await searchParams);

  const search = params.q ? `%${params.q}%` : null;
  const where = search
    ? and(eq(user.role, "student"), or(ilike(user.name, search), ilike(user.email, search)))
    : eq(user.role, "student");

  // Onboarding completion is derived, not stored, so the stage cannot be filtered in SQL.
  // The full matching set is scored in memory and paginated afterwards — correct at the
  // scale this app runs at, and it keeps the filter honest across pages.
  const chefs = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(where)
    .orderBy(desc(user.createdAt));

  const chefIds = chefs.map((chef) => chef.id);
  const [statuses, reviews] = await Promise.all([
    getOnboardingStatusForUsers(chefIds),
    getReviewsForUsers(chefIds),
  ]);

  const scored = chefs.map((chef) => {
    const status = statuses.get(chef.id) ?? {
      requiredTotal: 0,
      requiredAnswered: 0,
      missing: [],
      isComplete: true,
    };
    return { ...chef, status, stage: resolveStage(status.isComplete, reviews.get(chef.id)) };
  });

  const filtered = params.status ? scored.filter((chef) => chef.stage === params.status) : scored;

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page, totalPages);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const applicationCounts = pageRows.length
    ? await db
        .select({ userId: applications.studentUserId, total: count() })
        .from(applications)
        .where(
          inArray(
            applications.studentUserId,
            pageRows.map((chef) => chef.id),
          ),
        )
        .groupBy(applications.studentUserId)
    : [];

  const countByUser = new Map(applicationCounts.map((row) => [row.userId, Number(row.total)]));

  const rows: ChefRow[] = pageRows.map((chef) => ({
    id: chef.id,
    name: chef.name,
    email: chef.email,
    createdAt: chef.createdAt,
    requiredTotal: chef.status.requiredTotal,
    requiredAnswered: chef.status.requiredAnswered,
    stage: chef.stage,
    applicationCount: countByUser.get(chef.id) ?? 0,
  }));

  const awaitingCount = scored.filter((chef) => chef.stage === "pending").length;
  const approvedCount = scored.filter((chef) => chef.stage === "approved").length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-tight">Chefs</h1>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        {scored.length} registered chef{scored.length === 1 ? "" : "s"} · {awaitingCount} awaiting
        review · {approvedCount} approved.
      </p>

      <ChefsToolbar />

      <ChefsTable rows={rows} params={params} total={total} page={page} totalPages={totalPages} />
    </div>
  );
}
