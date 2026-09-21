'use client'

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { QuestionOption } from '@/lib/onboarding-types'

interface Props {
  value: QuestionOption[]
  onChange: (options: QuestionOption[]) => void
  /** Values already chosen by chefs: renameable, but not removable. */
  lockedValues?: string[]
}

function slugify(label: string) {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'option'
  )
}

export default function OptionsEditor({ value, onChange, lockedValues = [] }: Props) {
  const locked = new Set(lockedValues)

  function update(index: number, patch: Partial<QuestionOption>) {
    onChange(value.map((option, i) => (i === index ? { ...option, ...patch } : option)))
  }

  function addOption() {
    onChange([...value, { value: '', label: '', labelIt: '' }])
  }

  function removeOption(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-xs text-muted-foreground">
          No options yet. Chefs need at least two to choose from.
        </p>
      )}

      {value.map((option, index) => {
        const isLocked = locked.has(option.value)
        return (
          <div
            key={index}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/40 p-2"
          >
            <div className="flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Move option up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ChevronUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Move option down"
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
              >
                <ChevronDown />
              </Button>
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                value={option.label}
                placeholder="Option in English"
                aria-label={`Option ${index + 1}, English`}
                onChange={(e) => {
                  const label = e.target.value
                  // The stored value is only auto-derived while the option is new: once a
                  // chef has picked it, changing it would orphan their answer.
                  update(index, isLocked ? { label } : { label, value: slugify(label) })
                }}
              />
              <Input
                value={option.labelIt ?? ''}
                placeholder="Option in Italian (optional)"
                aria-label={`Option ${index + 1}, Italian`}
                onChange={(e) => update(index, { labelIt: e.target.value })}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove option"
              disabled={isLocked}
              title={isLocked ? 'Chefs have already chosen this option' : 'Remove option'}
              className="text-muted-foreground hover:text-red-400"
              onClick={() => removeOption(index)}
            >
              <Trash2 />
            </Button>
          </div>
        )
      })}

      <Button type="button" variant="outline" size="sm" onClick={addOption}>
        <Plus />
        Add option
      </Button>
    </div>
  )
}
