"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { submitApplicationAction } from "@/app/opportunities/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Mode = 'info' | 'apply' | 'counter';

interface ModalProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opportunity: any;
  initialMode?: Mode | null;
  onClose: () => void;
}

const TAB_TRIGGER =
  "h-auto flex-none rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-0 pt-0 pb-3 text-sm font-normal uppercase tracking-wider text-muted-foreground hover:text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground after:hidden";
const FIELD_LABEL =
  "inline text-xs font-normal leading-4 uppercase tracking-widest text-muted-foreground";
const FIELD_INPUT =
  "h-auto rounded-lg border-border bg-background px-4 py-3 text-sm shadow-none placeholder:text-foreground/50 focus-visible:border-primary focus-visible:ring-0";

export default function ApplicationModal({ opportunity, initialMode, onClose }: ModalProps) {
  const { data: session } = useSession();
  const [mode, setMode] = useState<Mode>(initialMode || 'info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("opportunityId", opportunity.id);
    formData.set("type", mode === 'counter' ? 'counter' : 'apply');

    const result = await submitApplicationAction(formData);

    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setIsSuccess(true);
    setTimeout(onClose, 2000);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        // Centered with auto margins instead of translate(-50%) so borders stay on whole pixels
        className="inset-0 m-auto flex h-fit max-h-[90vh] max-w-[calc(100%-2rem)] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl border-border/50 bg-card p-0 shadow-2xl sm:max-w-[min(48rem,calc(100%-3rem))]"
      >
        {/* Header/Image Area */}
        <div className="relative h-48 sm:h-64 w-full shrink-0">
          <Image src={opportunity.imagePath} alt={opportunity.labelTitle} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              className="absolute top-4 right-4 size-auto rounded-full border border-white/10 bg-background/50 p-2 text-white backdrop-blur transition-colors hover:bg-background/80 hover:text-white"
            >
              <X className="size-4.5 text-white" />
            </Button>
          </DialogClose>

          <div className="absolute bottom-6 left-6 right-6">
            <Badge
              variant="outline"
              className="mb-3 inline-block overflow-visible border-primary/30 bg-primary/20 px-3 py-1 text-xs font-normal uppercase tracking-wider text-primary"
            >
              {opportunity.category}
            </Badge>
            <DialogTitle className="text-2xl font-light leading-8 text-white sm:text-3xl sm:leading-9">
              {opportunity.labelTitle}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Details and application form for {opportunity.labelTitle}
            </DialogDescription>
          </div>
        </div>

        {/* Modal Body */}
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as Mode)}
          className="flex-1 gap-0 overflow-y-auto p-6"
        >
          {/* Navigation specific to modal inner state */}
          <TabsList
            variant="line"
            className="mb-6 w-full shrink-0 justify-start gap-6 border-b border-border/50 p-0 group-data-[orientation=horizontal]/tabs:h-auto"
          >
            <TabsTrigger value="info" className={TAB_TRIGGER}>Details</TabsTrigger>
            <TabsTrigger value="apply" className={TAB_TRIGGER}>Apply</TabsTrigger>
            {opportunity.allowCounterProposal && (
              <TabsTrigger value="counter" className={TAB_TRIGGER}>Counter Proposal</TabsTrigger>
            )}
          </TabsList>

          {/* One panel that follows the active tab, so the form keeps its state when switching apply <-> counter */}
          <TabsContent value={mode}>
            {mode === 'info' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                   <DetailItem label="Location" value={`${opportunity.location} ${opportunity.country ? `— ${opportunity.country}` : ''}`} />
                   <DetailItem label="Engagement Type" value={opportunity.engagementType} />
                   <DetailItem label="Compensation" value={opportunity.compensationText} />
                   {opportunity.propertyName && <DetailItem label="Property / Vessel" value={opportunity.propertyName} />}
                   {opportunity.guestCapacity && <DetailItem label="Guest Capacity" value={opportunity.guestCapacity.toString()} />}
                   {opportunity.crewSize && <DetailItem label="Crew Size" value={opportunity.crewSize.toString()} />}
                   {opportunity.accommodationDetails && <DetailItem label="Accommodation" value={opportunity.accommodationDetails} />}
                   {opportunity.benefits && <DetailItem label="Benefits" value={opportunity.benefits} />}
                </div>

                <div className="pt-6 flex gap-3">
                  <Button
                    variant="white"
                    onClick={() => setMode('apply')}
                    className="h-auto flex-1 whitespace-normal rounded-xl px-6 py-3 transition-colors"
                  >
                    Apply Now
                  </Button>
                  {opportunity.allowCounterProposal && (
                    <Button
                      variant="outline"
                      onClick={() => setMode('counter')}
                      className="h-auto flex-1 whitespace-normal rounded-xl border-border bg-transparent px-6 py-3 text-foreground shadow-none transition-colors hover:bg-card hover:text-foreground"
                    >
                      Send Counter Proposal
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {(mode === 'apply' || mode === 'counter') && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {isSuccess ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary">
                      ✓
                    </div>
                    <h3 className="text-xl font-medium">Application Received</h3>
                    <p className="text-muted-foreground text-sm max-w-xs block">Thank you! Our recruitment team will review your profile and contact you shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <p className="text-sm text-muted-foreground mb-4">
                      {mode === 'counter'
                        ? `Submit your proposed terms for ${opportunity.labelTitle}. Our team evaluates all serious proposals.`
                        : `Submit your profile for the position at ${opportunity.labelTitle}.`}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="application-name" className={FIELD_LABEL}>Full Name</Label>
                        <Input id="application-name" name="name" defaultValue={session?.user.name ?? ""} required type="text" className={FIELD_INPUT} placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="application-email" className={FIELD_LABEL}>Email</Label>
                        <Input id="application-email" name="email" defaultValue={session?.user.email ?? ""} required type="email" className={FIELD_INPUT} placeholder="john@example.com" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="application-phone" className={FIELD_LABEL}>Phone Number</Label>
                      <Input id="application-phone" name="phone" type="tel" className={FIELD_INPUT} placeholder="+1..." />
                    </div>

                    {mode === 'counter' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="application-compensation" className={`${FIELD_LABEL} text-primary`}>Proposed Compensation</Label>
                          <Input id="application-compensation" name="proposedCompensation" required type="text" className={`${FIELD_INPUT} border-primary/50 bg-card text-white placeholder:text-white/50`} placeholder="e.g. €700 / day" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="application-availability" className={FIELD_LABEL}>Availability Window</Label>
                          <Input id="application-availability" name="availabilityWindow" type="text" className={FIELD_INPUT} placeholder="e.g. June to Sept" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="application-notes" className={FIELD_LABEL}>Notes / Cover Details</Label>
                      <Textarea id="application-notes" name="notes" rows={4} className={`${FIELD_INPUT} inline-block field-sizing-fixed min-h-0 resize-none`} placeholder="Provide any additional context..." />
                    </div>

                    {error && (
                      <Alert variant="error">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      variant="white"
                      disabled={isSubmitting}
                      type="submit"
                      className="mt-4 h-auto w-full rounded-xl py-3.5 transition-opacity"
                    >
                      {isSubmitting ? "Submitting..." : (mode === 'counter' ? "Submit Proposal" : "Submit Application")}
                    </Button>
                  </form>
                )}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className="text-foreground/90 font-light text-sm">{value}</div>
    </div>
  );
}
