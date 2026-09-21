'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Toggle } from '@/components/ui/toggle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AnswerValue, QuestionConfig, QuestionOption } from '@/lib/onboarding-types'
import { localizeQuestion, maxFilesFor } from '@/lib/onboarding-types'
import { useLanguage } from '@/contexts/LanguageContext'
import FileUploadField, { type UploadedFile } from './FileUploadField'
import { CHIPS_TO_SELECT_THRESHOLD, CHIP_CLASS } from './question-chip'

export interface RenderableQuestion {
  id: string
  type: string
  label: string
  helpText: string | null
  placeholder: string | null
  labelIt: string | null
  helpTextIt: string | null
  placeholderIt: string | null
  required: boolean
  options: QuestionOption[] | null
  config: QuestionConfig | null
}

/** The wording for the reader's current language, with an English fallback. */
export function useLocalizedQuestion(question: RenderableQuestion) {
  const { language } = useLanguage()
  return localizeQuestion(question, language)
}

export type LocalizedQuestion = ReturnType<typeof useLocalizedQuestion>

interface Props {
  question: RenderableQuestion
  value: AnswerValue | null
  onChange: (value: AnswerValue | null) => void
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
  userId: string
  onBusyChange?: (busy: boolean) => void
  autoFocus?: boolean
}

/** Renders one question by type. Shared by the onboarding stepper and the chef profile. */
export default function QuestionField({
  question,
  value,
  onChange,
  files,
  onFilesChange,
  userId,
  onBusyChange,
  autoFocus,
}: Props) {
  const { t } = useLanguage()
  const localized = useLocalizedQuestion(question)
  const options = localized.options ?? []
  const selected = value?.kind === 'choice' ? value.values : []

  function toggleChoice(optionValue: string, multi: boolean) {
    if (!multi) {
      onChange(selected[0] === optionValue ? null : { kind: 'choice', values: [optionValue] })
      return
    }
    const next = selected.includes(optionValue)
      ? selected.filter((v) => v !== optionValue)
      : [...selected, optionValue]
    onChange(next.length ? { kind: 'choice', values: next } : null)
  }

  switch (question.type) {
    case 'short_text':
      return (
        <Input
          autoFocus={autoFocus}
          aria-label={localized.label}
          placeholder={localized.placeholder ?? ''}
          maxLength={question.config?.maxLength ?? 200}
          value={value?.kind === 'text' ? value.text : ''}
          onChange={(e) => onChange(e.target.value ? { kind: 'text', text: e.target.value } : null)}
        />
      )

    case 'long_text':
      return (
        <Textarea
          autoFocus={autoFocus}
          aria-label={localized.label}
          rows={5}
          placeholder={localized.placeholder ?? ''}
          maxLength={question.config?.maxLength ?? 2000}
          value={value?.kind === 'text' ? value.text : ''}
          onChange={(e) => onChange(e.target.value ? { kind: 'text', text: e.target.value } : null)}
        />
      )

    case 'number':
      return (
        <Input
          autoFocus={autoFocus}
          aria-label={localized.label}
          type="number"
          inputMode="numeric"
          placeholder={localized.placeholder ?? ''}
          min={question.config?.min}
          max={question.config?.max}
          value={value?.kind === 'number' ? String(value.number) : ''}
          onChange={(e) =>
            onChange(e.target.value === '' ? null : { kind: 'number', number: Number(e.target.value) })
          }
        />
      )

    case 'date':
      return (
        <Input
          autoFocus={autoFocus}
          aria-label={localized.label}
          type="date"
          className="w-full sm:w-64"
          value={value?.kind === 'date' ? value.date : ''}
          onChange={(e) => onChange(e.target.value ? { kind: 'date', date: e.target.value } : null)}
        />
      )

    case 'yes_no':
      return (
        <div className="flex flex-wrap gap-3">
          {[
            { label: t('yes'), bool: true },
            { label: t('no'), bool: false },
          ].map((option) => (
            <Toggle
              key={option.label}
              pressed={value?.kind === 'bool' && value.bool === option.bool}
              onPressedChange={(pressed) =>
                onChange(pressed ? { kind: 'bool', bool: option.bool } : null)
              }
              className={CHIP_CLASS}
            >
              {option.label}
            </Toggle>
          ))}
        </div>
      )

    case 'single_choice':
      if (options.length > CHIPS_TO_SELECT_THRESHOLD) {
        return (
          <Select
            value={selected[0] ?? ''}
            onValueChange={(next) => onChange({ kind: 'choice', values: [next] })}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder={t('selectAnOption')} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
      return (
        <div className="flex flex-wrap gap-3">
          {options.map((option) => (
            <Toggle
              key={option.value}
              pressed={selected.includes(option.value)}
              onPressedChange={() => toggleChoice(option.value, false)}
              className={CHIP_CLASS}
            >
              {option.label}
            </Toggle>
          ))}
        </div>
      )

    case 'multi_choice':
      return (
        <div className="flex flex-wrap gap-3">
          {options.map((option) => (
            <Toggle
              key={option.value}
              pressed={selected.includes(option.value)}
              onPressedChange={() => toggleChoice(option.value, true)}
              className={CHIP_CLASS}
            >
              {option.label}
            </Toggle>
          ))}
        </div>
      )

    case 'file':
    case 'files':
      return (
        <FileUploadField
          questionId={question.id}
          userId={userId}
          maxFiles={maxFilesFor(question)}
          files={files}
          onFilesChange={onFilesChange}
          onBusyChange={onBusyChange}
        />
      )

    default:
      return (
        <p className="text-sm text-muted-foreground">{t('unsupportedQuestion')}</p>
      )
  }
}
