"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { parseAsArrayOf, parseAsString, parseAsInteger, useQueryState } from "nuqs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import ApplicationModal from "@/components/ApplicationModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { OPPORTUNITY_CATEGORIES, OPPORTUNITY_ENGAGEMENT_TYPES } from "@/lib/opportunity-options";

interface Opportunity {
  id: string;
  category: string;
  labelTitle: string;
  imagePath: string;
  location: string;
  country: string | null;
  engagementType: string;
  compensationText: string;
  compensationNumeric: number | null;
  currency: string | null;
  allowCounterProposal: boolean | null;
  propertyName: string | null;
  guestCapacity: number | null;
  accommodationDetails: string | null;
  benefits: string | null;
  vesselName: string | null;
  flag: string | null;
  crewSize: number | null;
}

interface Props {
  initialData: Opportunity[];
  initialFilters: {
    engagement: string[];
    category: string[];
    compensation: number;
  };
}

const MotionCard = motion.create(Card);

const CATEGORIES = OPPORTUNITY_CATEGORIES;
const ENGAGEMENT_TYPES = OPPORTUNITY_ENGAGEMENT_TYPES;

export default function OpportunitiesClient({ initialData, initialFilters }: Props) {
  const { t, tValue } = useLanguage();
  // Sync state with URL using nuqs
  const [engagementQS, setEngagementQS] = useQueryState("engagement", parseAsArrayOf(parseAsString).withDefault(initialFilters.engagement));
  const [categoryQS, setCategoryQS] = useQueryState("category", parseAsArrayOf(parseAsString).withDefault(initialFilters.category));
  const [compensationQS, setCompensationQS] = useQueryState("compensation", parseAsInteger.withDefault(initialFilters.compensation));

  // Modals state
  const [selectedOp, setSelectedOp] = useState<Opportunity | null>(null);
  const [applyMode, setApplyMode] = useState<'apply' | 'counter' | null>(null);

  // Client-side filtering logic for snappy experience without full roundtrips
  const filteredData = useMemo(() => {
    return initialData.filter(op => {
      // It's possible the server already filtered, but doing it again locally 
      // allows pure client-side interaction without re-fetching unless URL changes trigger 
      // an RSC payload (nuqs shallow routes by default).
      let matches = true;
      if (engagementQS.length > 0 && !engagementQS.includes(op.engagementType)) matches = false;
      if (categoryQS.length > 0 && !categoryQS.includes(op.category)) matches = false;
      if (compensationQS > 250 && op.compensationNumeric && op.compensationNumeric < compensationQS) matches = false;
      return matches;
    });
  }, [initialData, engagementQS, categoryQS, compensationQS]);

  const toggleFilter = (list: string[], item: string, setter: (val: string[] | null) => void) => {
    if (list.includes(item)) {
      const next = list.filter(i => i !== item);
      setter(next.length ? next : null);
    } else {
      setter([...list, item]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      {/* Sidebar Filters */}
      <aside className="lg:w-1/4 w-full shrink-0 space-y-10">
        <Card className="gap-0 bg-card/30 border-border/50 rounded-2xl p-6 shadow-none backdrop-blur-sm">
          <div className="space-y-8">
            {/* Compensation Slider */}
            <div>
              <h3 className="text-sm font-medium tracking-wider uppercase text-muted-foreground mb-6">{t("minimumPay")}</h3>
              <Slider 
                value={[compensationQS]} 
                min={250} max={5000} step={50} 
                onValueChange={(val) => setCompensationQS(val[0])} 
              />
              <div className="mt-3 text-right text-sm text-primary">{t("dayRatePrefix")}{compensationQS}{t("dayRateSuffix")}</div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium tracking-wider uppercase text-muted-foreground mb-4">{t("category")}</h3>
              <div className="flex flex-col space-y-2">
                {CATEGORIES.map(c => (
                  <label key={c} className="flex items-center space-x-3 cursor-pointer group">
                    <Checkbox
                      checked={categoryQS.includes(c)}
                      onCheckedChange={() => toggleFilter(categoryQS, c, setCategoryQS)}
                      className="group-hover:border-primary/50 data-[state=checked]:group-hover:border-primary"
                    />
                    <span className="text-sm text-foreground/80">{tValue(c)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Engagement */}
            <div>
              <h3 className="text-sm font-medium tracking-wider uppercase text-muted-foreground mb-4">{t("engagement")}</h3>
              <div className="flex flex-col space-y-2">
                {ENGAGEMENT_TYPES.map(c => (
                  <label key={c} className="flex items-center space-x-3 cursor-pointer group">
                    <Checkbox
                      checked={engagementQS.includes(c)}
                      onCheckedChange={() => toggleFilter(engagementQS, c, setEngagementQS)}
                      className="group-hover:border-primary/50 data-[state=checked]:group-hover:border-primary"
                    />
                    <span className="text-sm text-foreground/80">{tValue(c)}</span>
                  </label>
                ))}
              </div>
            </div>
            
          </div>
        </Card>
      </aside>

      {/* Grid */}
      <div className="lg:w-3/4 w-full">
        <div className="mb-6 flex justify-between items-center text-sm text-muted-foreground">
          <span>{t("opportunitiesVisible", { count: filteredData.length })}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredData.map(op => (
              <MotionCard 
                layout 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={op.id} 
                className="group relative gap-0 py-0 bg-card/20 border-border/50 rounded-2xl overflow-hidden shadow-none hover:border-primary/50 transition-colors"
              >
                {/* Image Handle */}
                <div className="relative h-56 w-full overflow-hidden cursor-pointer" onClick={() => setSelectedOp(op)}>
                  <Image 
                    src={op.imagePath} 
                    alt={op.labelTitle} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => { e.currentTarget.src = '/landing.png'; }} // fallback
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />
                  
                  {/* Category Label Overlay */}
                  <Badge
                    variant="outline"
                    className="absolute top-4 left-4 overflow-visible bg-background/80 backdrop-blur-md px-3 py-1.5 border-white/10 uppercase tracking-widest text-[10px] font-normal text-primary"
                  >
                    {tValue(op.category)}
                  </Badge>
                  
                  {/* Title & Location Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 text-left pointer-events-none">
                    <h3 className="text-lg font-medium text-white line-clamp-1">{op.labelTitle}</h3>
                    <p className="text-xs text-white/70 font-light truncate">{op.location} {op.country ? `— ${op.country}` : ''}</p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm justify-between">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t("cardEngagement")}</div>
                      <div className="text-foreground/90 font-light truncate">{tValue(op.engagementType)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t("cardCompensation")}</div>
                      <div className="text-primary font-medium truncate">{op.compensationText}</div>
                    </div>
                    {op.guestCapacity && (
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t("cardGuests")}</div>
                        <div className="text-foreground/90 font-light">{op.guestCapacity}</div>
                      </div>
                    )}
                    {op.accommodationDetails && (
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t("cardAccommodation")}</div>
                        <div className="text-foreground/90 font-light truncate">{op.accommodationDetails}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="white"
                      onClick={() => { setSelectedOp(op); setApplyMode('apply'); }}
                      className="h-auto flex-1 whitespace-normal rounded-lg border border-transparent px-0 py-2.5 transition-colors"
                    >
                      {t("applyNow")}
                    </Button>
                    {op.allowCounterProposal && (
                      <Button 
                         variant="outline"
                         onClick={() => { setSelectedOp(op); setApplyMode('counter'); }}
                         className="h-auto flex-1 whitespace-normal rounded-lg border-border bg-transparent px-0 py-2.5 text-foreground shadow-none transition-colors hover:bg-card hover:text-foreground"
                      >
                        {t("counterProposal")}
                      </Button>
                    )}
                  </div>
                </div>
              </MotionCard>
            ))}
          </AnimatePresence>
        </div>

        {filteredData.length === 0 && (
          <Card className="w-full gap-0 py-32 text-center rounded-2xl border-dashed border-border/50 bg-transparent shadow-none">
            <h3 className="text-lg text-muted-foreground">{t("noOpportunities")}</h3>
            <p className="text-sm text-muted-foreground/60 mt-2">{t("tryWidening")}</p>
          </Card>
        )}
      </div>

      {/* Application / Details Modal overlay handle */}
      {selectedOp && (
        <ApplicationModal 
          opportunity={selectedOp} 
          initialMode={applyMode} 
          onClose={() => { setSelectedOp(null); setApplyMode(null); }} 
        />
      )}
    </div>
  );
}
