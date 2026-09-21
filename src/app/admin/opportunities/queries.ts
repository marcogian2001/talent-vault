import { and, asc, desc, eq, gte, ilike, sql, type SQL } from "drizzle-orm";
import { opportunities } from "@/db/schema";
import type { SortDir, SortKey, TableParams } from "./table-params";

// ILIKE treats % and _ as wildcards and \ as the escape character.
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function buildWhere(params: TableParams): SQL | undefined {
  return and(
    params.q ? ilike(opportunities.labelTitle, `%${escapeLike(params.q)}%`) : undefined,
    params.category ? eq(opportunities.category, params.category) : undefined,
    params.engagement ? eq(opportunities.engagementType, params.engagement) : undefined,
    params.location ? eq(opportunities.location, params.location) : undefined,
    params.minComp !== null ? gte(opportunities.compensationNumeric, params.minComp) : undefined
  );
}

export function buildOrderBy(sort: SortKey | null, dir: SortDir): SQL[] {
  const direction = dir === "asc" ? asc : desc;
  // `id` as the last tie-breaker keeps pages stable when the sorted column has duplicates.
  const tieBreaker = asc(opportunities.id);

  switch (sort) {
    case "title":
      return [direction(opportunities.labelTitle), tieBreaker];
    case "category":
      return [direction(opportunities.category), tieBreaker];
    case "engagement":
      return [direction(opportunities.engagementType), tieBreaker];
    case "location":
      return [direction(opportunities.location), tieBreaker];
    case "compensation":
      // compensationNumeric is optional: rows without a number always go last.
      return [
        sql`${opportunities.compensationNumeric} ${dir === "asc" ? sql.raw("ASC") : sql.raw("DESC")} NULLS LAST`,
        direction(opportunities.compensationText),
        tieBreaker,
      ];
    default:
      return [desc(opportunities.createdAt), tieBreaker];
  }
}
