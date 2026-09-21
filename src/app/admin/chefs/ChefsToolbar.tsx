'use client'

import { useTransition } from 'react'
import { debounce, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ALL = 'all'
const TEXT_DEBOUNCE = debounce(300)

const filterParsers = {
  q: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),
  page: parseAsInteger,
}

export default function ChefsToolbar() {
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
    startTransition,
  })

  const hasFilters = Boolean(filters.q || filters.status)

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search chefs by name or email"
          placeholder="Search by name or email..."
          value={filters.q}
          onChange={(e) =>
            setFilters({ q: e.target.value || null, page: null }, { limitUrlUpdates: TEXT_DEBOUNCE })
          }
          className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
        />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <Select
        value={filters.status || ALL}
        onValueChange={(value) =>
          setFilters({ status: value === ALL ? null : value, page: null })
        }
      >
        <SelectTrigger aria-label="Review status" className="w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All chefs</SelectItem>
          <SelectItem value="pending">Awaiting review</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="incomplete">Onboarding incomplete</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setFilters({ q: null, status: null, page: null })}
          className="text-xs uppercase tracking-wider text-muted-foreground hover:bg-primary/10 hover:text-primary"
        >
          <X />
          Clear
        </Button>
      )}
    </div>
  )
}
