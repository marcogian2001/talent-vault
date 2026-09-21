export const PAGE_SIZE = 10;

export const SORT_KEYS = [
  "title",
  "category",
  "engagement",
  "compensation",
  "location",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

export interface TableParams {
  q: string;
  category: string;
  engagement: string;
  location: string;
  minComp: number | null;
  sort: SortKey | null;
  dir: SortDir;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function toNonNegativeInt(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const n = Number.parseInt(value, 10);
  return Number.isSafeInteger(n) ? n : null;
}

export function parseTableParams(raw: RawParams): TableParams {
  const sort = first(raw.sort);
  const page = toNonNegativeInt(first(raw.page));

  return {
    q: first(raw.q).trim(),
    category: first(raw.category),
    engagement: first(raw.engagement),
    location: first(raw.location),
    minComp: toNonNegativeInt(first(raw.minComp)),
    sort: (SORT_KEYS as readonly string[]).includes(sort) ? (sort as SortKey) : null,
    dir: first(raw.dir) === "desc" ? "desc" : "asc",
    page: page && page > 0 ? page : 1,
  };
}

export function hasActiveFilters(params: TableParams): boolean {
  return Boolean(
    params.q || params.category || params.engagement || params.location || params.minComp !== null
  );
}

export const CLEARED_FILTERS = {
  q: "",
  category: "",
  engagement: "",
  location: "",
  minComp: null,
} satisfies Partial<TableParams>;

/**
 * Builds a link to the table with `overrides` applied on top of `params`.
 * `page` goes back to 1 unless the caller sets it, so any filter or sort
 * change starts from the first page.
 */
export function buildHref(params: TableParams, overrides: Partial<TableParams> = {}): string {
  const next = { ...params, page: 1, ...overrides };
  const search = new URLSearchParams();

  if (next.q) search.set("q", next.q);
  if (next.category) search.set("category", next.category);
  if (next.engagement) search.set("engagement", next.engagement);
  if (next.location) search.set("location", next.location);
  if (next.minComp !== null) search.set("minComp", String(next.minComp));
  if (next.sort) {
    search.set("sort", next.sort);
    search.set("dir", next.dir);
  }
  if (next.page > 1) search.set("page", String(next.page));

  const query = search.toString();
  return query ? `/admin/opportunities?${query}` : "/admin/opportunities";
}
