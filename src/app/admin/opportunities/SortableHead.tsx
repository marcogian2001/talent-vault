import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { buildHref, type SortKey, type TableParams } from "./table-params";

interface Props {
  label: string;
  sortKey: SortKey;
  params: TableParams;
}

export default function SortableHead({ label, sortKey, params }: Props) {
  const isActive = params.sort === sortKey;
  const nextDir = isActive && params.dir === "asc" ? "desc" : "asc";
  const Icon = !isActive ? ArrowUpDown : params.dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead
      aria-sort={!isActive ? "none" : params.dir === "asc" ? "ascending" : "descending"}
      className="h-11 px-4 text-xs uppercase tracking-wider"
    >
      <Link
        href={buildHref(params, { sort: sortKey, dir: nextDir })}
        className={cn(
          "-mx-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:text-foreground",
          isActive ? "text-primary hover:text-primary" : "text-muted-foreground"
        )}
      >
        {label}
        <Icon className={cn("size-3.5", !isActive && "opacity-50")} />
      </Link>
    </TableHead>
  );
}
