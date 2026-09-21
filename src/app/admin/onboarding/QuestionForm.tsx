'use client'

import { useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { DEFAULT_MAX_FILES, QUESTION_TYPES, isChoiceType } from '@/lib/onboarding-types'
import { questionFormSchema, type QuestionFormValues } from './schema'
import { createQuestionAction, updateQuestionAction } from './actions'
import OptionsEditor from './OptionsEditor'

interface Props {
  questionId?: string
  answerCount?: number
  lockedOptionValues?: string[]
  defaultValues?: Partial<QuestionFormValues>
}

function FormSection({
  title,
  description,
  className,
  children,
}: {
  title: string
  description?: string
  className?: string
  children: ReactNode
}) {
  return (
    <Card className={cn('gap-5 rounded-2xl border-border/50 bg-card/20 py-6 shadow-none', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium tracking-wide">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

export default function QuestionForm({
  questionId,
  answerCount = 0,
  lockedOptionValues = [],
  defaultValues,
}: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      type: 'short_text',
      label: '',
      helpText: '',
      placeholder: '',
      labelIt: '',
      helpTextIt: '',
      placeholderIt: '',
      required: true,
      options: [],
      mustBeFuture: false,
      ...defaultValues,
    },
  })

  // Which extra fields to show depends on the chosen type; useWatch keeps that reactive
  // without the memoization caveats of form.watch().
  const type = useWatch({ control: form.control, name: 'type' })
  const typeLocked = answerCount > 0

  async function onSubmit(values: QuestionFormValues) {
    setError(null)
    setIsSubmitting(true)

    const result = questionId
      ? await updateQuestionAction(questionId, values)
      : await createQuestionAction(values)

    setIsSubmitting(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    router.push('/admin/onboarding')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <FormSection
              title="The question"
              description="What the chef reads during onboarding."
            >
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question (English)</FormLabel>
                    <FormControl>
                      <Input placeholder="Which other languages do you speak?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="labelIt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question (Italian)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Quali altre lingue parli?"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Shown to chefs who pick IT. Leave empty to show the English text.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="helpText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Help text (English)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Select every language you can work in."
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Shown in smaller type under the question. Optional.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="helpTextIt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Help text (Italian)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seleziona tutte le lingue in cui sai lavorare."
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(type === 'short_text' || type === 'long_text' || type === 'number') && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="placeholder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placeholder (English)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="placeholderIt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placeholder (Italian)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </FormSection>

            {isChoiceType(type) && (
              <FormSection title="Options" description="What the chef can pick from.">
                <FormField
                  control={form.control}
                  name="options"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Options</FormLabel>
                      <FormControl>
                        <OptionsEditor
                          value={field.value ?? []}
                          onChange={field.onChange}
                          lockedValues={lockedOptionValues}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>
            )}

            {(type === 'short_text' || type === 'long_text') && (
              <FormSection title="Limits">
                <FormField
                  control={form.control}
                  name="maxLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum characters</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={type === 'long_text' ? '2000' : '200'}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>
            )}

            {type === 'number' && (
              <FormSection title="Limits" description="Leave empty for no limit.">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {(['min', 'max'] as const).map((name) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{name === 'min' ? 'Minimum' : 'Maximum'}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === '' ? undefined : Number(e.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </FormSection>
            )}

            {type === 'date' && (
              <FormSection title="Date rules">
                <FormField
                  control={form.control}
                  name="mustBeFuture"
                  render={({ field }) => (
                    <FormItem className="flex-row items-start gap-3 rounded-xl border border-border/50 p-4 transition-colors hover:border-primary/40">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="grid gap-1">
                        <FormLabel className="cursor-pointer">Must be a future date</FormLabel>
                        <FormDescription className="text-xs">
                          For expiry dates: an already-expired document is rejected.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </FormSection>
            )}

            {type === 'files' && (
              <FormSection title="Upload limits">
                <FormField
                  control={form.control}
                  name="maxFiles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum number of files</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={DEFAULT_MAX_FILES}
                          placeholder="8"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Up to {DEFAULT_MAX_FILES}. Each file can be at most 10 MB.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>
            )}
          </div>

          <div className="space-y-6 self-start">
            <FormSection title="Answer type">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Answer type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={typeLocked}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUESTION_TYPES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {typeLocked && (
                      <FormDescription className="text-xs">
                        Locked: {answerCount} chef{answerCount > 1 ? 's have' : ' has'} already
                        answered this question.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Settings">
              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex-row items-start gap-3 rounded-xl border border-border/50 p-4 transition-colors hover:border-primary/40">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="grid gap-1">
                      <FormLabel className="cursor-pointer">Required</FormLabel>
                      <FormDescription className="text-xs">
                        Chefs cannot reach the opportunities until they answer it. Uncheck to let
                        them skip it.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </FormSection>
          </div>
        </div>

        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/80 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div aria-live="polite" className="min-w-0 sm:flex-1">
            {error ? (
              <Alert
                variant="error"
                className="py-2 text-destructive *:data-[slot=alert-description]:text-destructive"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : form.formState.isDirty ? (
              <p className="px-1 text-sm text-muted-foreground">Unsaved changes</p>
            ) : null}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.push('/admin/onboarding')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? 'Saving...' : questionId ? 'Save Changes' : 'Create Question'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
