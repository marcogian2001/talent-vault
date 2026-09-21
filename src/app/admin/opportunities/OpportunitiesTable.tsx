import Link from "next/link";
import { MapPin, Pencil } from "lucide-react";
import type { opportunities } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DeleteOpportunityButton from "./DeleteOpportunityButton";
import OpportunitiesPagination from "./OpportunitiesPagination";
import SortableHead from "./SortableHead";
import {
  buildHref,
  CLEARED_FILTERS,
  hasActiveFilters,
  PAGE_SIZE,
  type TableParams,
} from "./table-params";

type OpportunityRow = typeof opportunities.$inferSelect;

interface Props {
  rows: OpportunityRow[];
  params: TableParams;
  total: number;
  page: number;
  totalPages: number;
}

export default function OpportunitiesTable({ rows, params, total, page, totalPages }: Props) {
  const filtered = hasActiveFilters(params);
  const firstShown = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = (page - 1) * PAGE_SIZE + rows.length;

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border/50 bg-card/20 py-0 shadow-none">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <SortableHead label="Title" sortKey="title" params={params} />
            <SortableHead label="Category" sortKey="category" params={params} />
            <SortableHead label="Engagement" sortKey="engagement" params={params} />
            <SortableHead label="Compensation" sortKey="compensation" params={params} />
            <SortableHead label="Location" sortKey="location" params={params} />
            <TableHead className="h-11 px-4 text-right text-xs uppercase tracking-wider text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((op) => (
            <TableRow key={op.id} className="hover:bg-muted/30">
              <TableCell className="px-4 py-3 font-medium">{op.labelTitle}</TableCell>
              <TableCell className="px-4 py-3">
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 font-normal text-primary"
                >
                  {op.category}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3 text-foreground/80">{op.engagementType}</TableCell>
              <TableCell className="px-4 py-3 font-medium text-primary">
                {op.compensationText}
              </TableCell>
              <TableCell className="px-4 py-3 text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {op.location}
                </span>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="bg-transparent text-xs uppercase tracking-wider text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  >
                    <Link href={`/admin/opportunities/${op.id}/edit`}>
                      <Pencil />
                      Edit
                    </Link>
                  </Button>
                  <DeleteOpportunityButton id={op.id} title={op.labelTitle} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {rows.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          {filtered ? (
            <>
              <p>No opportunities match your filters.</p>
              <Button asChild variant="link" size="sm" className="mt-2">
                <Link href={buildHref(params, CLEARED_FILTERS)}>Clear filters</Link>
              </Button>
            </>
          ) : (
            <p>No opportunities yet.</p>
          )}
        </div>
      )}

      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/50 px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing {firstShown}–{lastShown} of {total}
          </p>
          {totalPages > 1 && (
            <OpportunitiesPagination params={params} page={page} totalPages={totalPages} />
          )}
        </div>
      )}
    </Card>
  );
}
