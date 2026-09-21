'use client'

import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { opportunityFormSchema, type OpportunityFormValues } from './schema'
import { createOpportunityAction, updateOpportunityAction } from './actions'
import ImageUploadField from './ImageUploadField'
import { OPPORTUNITY_CATEGORIES, OPPORTUNITY_ENGAGEMENT_TYPES } from '@/lib/opportunity-options'

interface Props {
  opportunityId?: string
  defaultValues?: Partial<OpportunityFormValues>
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

export default function OpportunityForm({ opportunityId, defaultValues }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      category: '',
      labelTitle: '',
      imagePath: '',
      location: '',
      country: '',
      engagementType: '',
      compensationText: '',
      currency: '€',
      allowCounterProposal: false,
      position: '',
      propertyName: '',
      accommodationDetails: '',
      benefits: '',
      vesselName: '',
      flag: '',
      ...defaultValues,
    },
  })

  async function onSubmit(values: OpportunityFormValues) {
    setError(null)
    setIsSubmitting(true)

    const result = opportunityId
      ? await updateOpportunityAction(opportunityId, values)
      : await createOpportunityAction(values)

    setIsSubmitting(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    router.push('/admin/opportunities')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr]">
          <FormSection
            title="Cover image"
            description="Shown on the opportunity cards and in the application dialog."
            className="lg:col-start-2 lg:row-start-1"
          >
            <FormField
              control={form.control}
              name="imagePath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Cover image</FormLabel>
                  <FormControl>
                    <ImageUploadField
                      value={field.value}
                      onChange={field.onChange}
                      onBusyChange={setIsUploading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          <div className="space-y-6 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <FormSection title="Basics" description="What this opportunity is called and how it is engaged.">
              <FormField
                control={form.control}
                name="labelTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Private Residency 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {OPPORTUNITY_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="engagementType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Engagement Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an engagement type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {OPPORTUNITY_ENGAGEMENT_TYPES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection title="Location" description="Where the role is based.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Lake Como" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Italy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection title="Compensation" description="What students see, and the number used to filter.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="compensationText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compensation Text</FormLabel>
                      <FormControl>
                        <Input placeholder="€500 / day" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="compensationNumeric"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numeric Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Used by the minimum-compensation filter.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="€" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection title="Property details" description="Optional context about the property or vessel.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="propertyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property / Vessel Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guestCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="crewSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crew Size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="accommodationDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accommodation Details</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>
          </div>

          <FormSection title="Settings" className="self-start lg:col-start-2 lg:row-start-2">
            <FormField
              control={form.control}
              name="allowCounterProposal"
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
                    <FormLabel className="cursor-pointer">Allow counter-proposals</FormLabel>
                    <FormDescription className="text-xs">
                      Students can propose their own terms instead of only applying.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </FormSection>
        </div>

        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/80 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div aria-live="polite" className="min-w-0 sm:flex-1">
            {error ? (
              <Alert variant="error" className="py-2 text-destructive *:data-[slot=alert-description]:text-destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : form.formState.isDirty ? (
              <p className="px-1 text-sm text-muted-foreground">Unsaved changes</p>
            ) : null}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.push('/admin/opportunities')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {(isSubmitting || isUploading) && <Loader2 className="animate-spin" />}
              {isSubmitting
                ? 'Saving...'
                : isUploading
                  ? 'Uploading image...'
                  : opportunityId
                    ? 'Save Changes'
                    : 'Create Opportunity'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
