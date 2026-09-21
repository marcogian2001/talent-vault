import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
import type { ChefStage } from "@/lib/chef-review";
import ChefsPagination from "./ChefsPagination";
import StageBadge from "./StageBadge";
import {
  buildHref,
  CLEARED_FILTERS,
  hasActiveFilters,
  PAGE_SIZE,
  type ChefsParams,
} from "./table-params";

export interface ChefRow {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  requiredTotal: number;
  requiredAnswered: number;
  stage: ChefStage;
  applicationCount: number;
}

interface Props {
  rows: ChefRow[];
  params: ChefsParams;
  total: number;
  page: number;
  totalPages: number;
}

export default function ChefsTable({ rows, params, total, page, totalPages }: Props) {
  const filtered = hasActiveFilters(params);
  const firstShown = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = (page - 1) * PAGE_SIZE + rows.length;

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border/50 bg-card/20 py-0 shadow-none">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            {["Chef", "Registered", "Status", "Applications"].map((label) => (
              <TableHead
                key={label}
                className="h-11 px-4 text-xs uppercase tracking-wider text-muted-foreground"
              >
                {label}
              </TableHead>
            ))}
            <TableHead className="h-11 px-4 text-right text-xs uppercase tracking-wider text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((chef) => (
            <TableRow key={chef.id} className="hover:bg-muted/30">
              <TableCell className="px-4 py-3">
                <div className="font-medium">{chef.name}</div>
                <div className="text-xs text-muted-foreground">{chef.email}</div>
              </TableCell>

              <TableCell className="px-4 py-3 text-muted-foreground">
                {chef.createdAt.toLocaleDateString()}
              </TableCell>

              <TableCell className="px-4 py-3">
                <StageBadge
                  stage={chef.stage}
                  detail={
                    chef.stage === "incomplete"
                      ? `${chef.requiredAnswered} / ${chef.requiredTotal}`
                      : undefined
                  }
                />
              </TableCell>

              <TableCell className="px-4 py-3 text-muted-foreground">
                {chef.applicationCount}
              </TableCell>

              <TableCell className="px-4 py-3">
                <div className="flex items-center justify-end">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="bg-transparent text-xs uppercase tracking-wider text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  >
                    <Link href={`/admin/chefs/${chef.id}`}>
                      View
                      <ArrowRight />
                    </Link>
                  </Button>
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
              <p>No chefs match your filters.</p>
              <Button asChild variant="link" size="sm" className="mt-2">
                <Link href={buildHref(params, CLEARED_FILTERS)}>Clear filters</Link>
              </Button>
            </>
          ) : (
            <p>No chefs have registered yet.</p>
          )}
        </div>
      )}

      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/50 px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing {firstShown}–{lastShown} of {total}
          </p>
          {totalPages > 1 && (
            <ChefsPagination params={params} page={page} totalPages={totalPages} />
          )}
        </div>
      )}
    </Card>
  );
}
