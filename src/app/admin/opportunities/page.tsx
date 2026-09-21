import Link from "next/link";
import { asc, count } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { Button } from "@/components/ui/button";
import OpportunitiesTable from "./OpportunitiesTable";
import OpportunitiesToolbar from "./OpportunitiesToolbar";
import { buildOrderBy, buildWhere } from "./queries";
import { PAGE_SIZE, parseTableParams } from "./table-params";

export default async function AdminOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseTableParams(await searchParams);
  const where = buildWhere(params);

  const [[{ total }], locationRows] = await Promise.all([
    db.select({ total: count() }).from(opportunities).where(where),
    db
      .selectDistinct({ location: opportunities.location })
      .from(opportunities)
      .orderBy(asc(opportunities.location)),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page, totalPages);

  const rows = await db
    .select()
    .from(opportunities)
    .where(where)
    .orderBy(...buildOrderBy(params.sort, params.dir))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-light tracking-tight">Opportunities</h1>
        <Button asChild>
          <Link href="/admin/opportunities/new">
            <Plus />
            New Opportunity
          </Link>
        </Button>
      </div>

      <OpportunitiesToolbar locations={locationRows.map((r) => r.location)} />

      <OpportunitiesTable
        rows={rows}
        params={params}
        total={total}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
