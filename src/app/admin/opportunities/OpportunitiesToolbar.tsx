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
import { OPPORTUNITY_CATEGORIES, OPPORTUNITY_ENGAGEMENT_TYPES } from '@/lib/opportunity-options'

const ALL = 'all'
const TEXT_DEBOUNCE = debounce(300)

const filterParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsString.withDefault(''),
  engagement: parseAsString.withDefault(''),
  location: parseAsString.withDefault(''),
  minComp: parseAsInteger,
  page: parseAsInteger,
}

interface Props {
  locations: string[]
}

// The current value is always part of the options, so a filter coming from a
// shared link still shows its label even if it isn't in the known list.
function withCurrent(options: readonly string[], current: string) {
  return current && !options.includes(current) ? [...options, current] : options
}

export default function OpportunitiesToolbar({ locations }: Props) {
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
    startTransition,
  })

  const hasFilters = Boolean(
    filters.q || filters.category || filters.engagement || filters.location || filters.minComp !== null
  )

  function setSelect(key: 'category' | 'engagement' | 'location', value: string) {
    setFilters({ [key]: value === ALL ? null : value, page: null })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search opportunities by title"
          placeholder="Search by title..."
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

      <FilterSelect
        label="Category"
        value={filters.category}
        options={withCurrent(OPPORTUNITY_CATEGORIES, filters.category)}
        onChange={(v) => setSelect('category', v)}
      />
      <FilterSelect
        label="Engagement"
        value={filters.engagement}
        options={withCurrent(OPPORTUNITY_ENGAGEMENT_TYPES, filters.engagement)}
        onChange={(v) => setSelect('engagement', v)}
      />
      <FilterSelect
        label="Location"
        value={filters.location}
        options={withCurrent(locations, filters.location)}
        onChange={(v) => setSelect('location', v)}
      />

      <Input
        type="number"
        min={0}
        inputMode="numeric"
        aria-label="Minimum compensation"
        placeholder="Min compensation"
        value={filters.minComp ?? ''}
        onChange={(e) => {
          const n = e.target.valueAsNumber
          setFilters(
            { minComp: Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null, page: null },
            { limitUrlUpdates: TEXT_DEBOUNCE }
          )
        }}
        className="w-[170px]"
      />

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setFilters({ q: null, category: null, engagement: null, location: null, minComp: null, page: null })
          }
          className="text-xs uppercase tracking-wider text-muted-foreground hover:bg-primary/10 hover:text-primary"
        >
          <X />
          Clear
        </Button>
      )}
    </div>
  )
}

interface FilterSelectProps {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <Select value={value || ALL} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-[180px]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label.toLowerCase()}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
