export const PAGE_SIZE = 20;

// The chef's overall stage: unfinished questionnaire, then the review outcome.
export const STATUS_FILTERS = ["pending", "approved", "rejected", "incomplete"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export interface ChefsParams {
  q: string;
  status: StatusFilter | "";
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseChefsParams(raw: RawParams): ChefsParams {
  const status = first(raw.status);
  const page = Number.parseInt(first(raw.page), 10);

  return {
    q: first(raw.q).trim(),
    status: (STATUS_FILTERS as readonly string[]).includes(status) ? (status as StatusFilter) : "",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function hasActiveFilters(params: ChefsParams): boolean {
  return Boolean(params.q || params.status);
}

export const CLEARED_FILTERS = { q: "", status: "" } satisfies Partial<ChefsParams>;

/** Same contract as the opportunities table: any filter change resets to page 1. */
export function buildHref(params: ChefsParams, overrides: Partial<ChefsParams> = {}): string {
  const next = { ...params, page: 1, ...overrides };
  const search = new URLSearchParams();

  if (next.q) search.set("q", next.q);
  if (next.status) search.set("status", next.status);
  if (next.page > 1) search.set("page", String(next.page));

  const query = search.toString();
  return query ? `/admin/chefs?${query}` : "/admin/chefs";
}
