import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { buildHref, type ChefsParams } from "./table-params";

interface Props {
  params: ChefsParams;
  page: number;
  totalPages: number;
}

const DISABLED = "pointer-events-none opacity-50";

function getPageItems(page: number, total: number): (number | "gap-start" | "gap-end")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const start = Math.max(2, Math.min(page - 1, total - 3));
  const end = Math.min(total - 1, Math.max(page + 1, 4));
  const items: (number | "gap-start" | "gap-end")[] = [1];

  if (start > 2) items.push("gap-start");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push("gap-end");
  items.push(total);

  return items;
}

export default function ChefsPagination({ params, page, totalPages }: Props) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <Pagination className="mx-0 w-auto justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={buildHref(params, { page: page - 1 })}
            aria-disabled={!hasPrev}
            tabIndex={hasPrev ? undefined : -1}
            className={cn(!hasPrev && DISABLED)}
          />
        </PaginationItem>

        {getPageItems(page, totalPages).map((item) =>
          typeof item === "number" ? (
            <PaginationItem key={item}>
              <PaginationLink href={buildHref(params, { page: item })} isActive={item === page}>
                {item}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationEllipsis />
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href={buildHref(params, { page: page + 1 })}
            aria-disabled={!hasNext}
            tabIndex={hasNext ? undefined : -1}
            className={cn(!hasNext && DISABLED)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
