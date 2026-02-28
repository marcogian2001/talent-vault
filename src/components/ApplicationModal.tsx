"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface ModalProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opportunity: any;
  initialMode?: 'apply' | 'counter' | 'info' | null;
  onClose: () => void;
}

export default function ApplicationModal({ opportunity, initialMode, onClose }: ModalProps) {
  const [mode, setMode] = useState<'info' | 'apply' | 'counter'>(initialMode || 'info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Fake submit delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(onClose, 2000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-card border border-border/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header/Image Area */}
        <div className="relative h-48 sm:h-64 w-full shrink-0">
          <Image src={opportunity.imagePath} alt={opportunity.labelTitle} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-background/50 hover:bg-background/80 backdrop-blur p-2 rounded-full transition-colors border border-white/10"
          >
            <X size={18} className="text-white" />
          </button>
          
          <div className="absolute bottom-6 left-6 right-6">
            <span className="bg-primary/20 text-primary border border-primary/30 text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
              {opportunity.category}
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white">{opportunity.labelTitle}</h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {/* Navigation specific to modal inner state */}
          <div className="flex space-x-6 border-b border-border/50 mb-6 shrink-0">
            <button 
              onClick={() => setMode('info')} 
              className={`pb-3 text-sm tracking-wider uppercase transition-colors ${mode === 'info' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground border-b-2 border-transparent'}`}
            >
              Details
            </button>
            <button 
              onClick={() => setMode('apply')} 
              className={`pb-3 text-sm tracking-wider uppercase transition-colors ${mode === 'apply' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground border-b-2 border-transparent'}`}
            >
              Apply
            </button>
            {opportunity.allowCounterProposal && (
              <button 
                onClick={() => setMode('counter')} 
                className={`pb-3 text-sm tracking-wider uppercase transition-colors ${mode === 'counter' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground border-b-2 border-transparent'}`}
              >
                Counter Proposal
              </button>
            )}
          </div>

          <div className="flex-1">
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
                  <button onClick={() => setMode('apply')} className="bg-white text-black px-6 py-3 rounded-xl font-medium text-sm flex-1 hover:bg-white/90 transition-colors">Apply Now</button>
                  {opportunity.allowCounterProposal && (
                    <button onClick={() => setMode('counter')} className="bg-transparent text-foreground border border-border px-6 py-3 rounded-xl font-medium text-sm flex-1 hover:bg-card transition-colors">Send Counter Proposal</button>
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
                        <label className="text-xs uppercase tracking-widest text-muted-foreground">Full Name</label>
                        <input required type="text" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
                        <input required type="email" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="john@example.com" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">Phone Number</label>
                      <input type="tel" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="+1..." />
                    </div>

                    {mode === 'counter' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest text-muted-foreground text-primary">Proposed Compensation</label>
                          <input required type="text" className="w-full bg-card border border-primary/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors text-white" placeholder="e.g. €700 / day" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest text-muted-foreground">Availability Window</label>
                          <input type="text" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. June to Sept" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">Notes / Cover Details</label>
                      <textarea rows={4} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none" placeholder="Provide any additional context..." />
                    </div>

                    <button disabled={isSubmitting} type="submit" className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-50 py-3.5 rounded-xl font-medium text-sm transition-opacity mt-4">
                      {isSubmitting ? "Submitting..." : (mode === 'counter' ? "Submit Proposal" : "Submit Application")}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
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
