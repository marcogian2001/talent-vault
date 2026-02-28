"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLiveOpportunitiesCount } from "./actions";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";

const ENGAGEMENT_TYPES = ["Single Service", "Seasonal", "Appointment", "Permanent Position"];
const CONTEXTS = ["Private Residency", "Private Yacht", "Expedition Cruises", "Luxury Resort", "Fine Dining Omakase"]; // Combined categories / contexts
const GEO_AREAS = ["Global", "North Europe", "Mediterranean", "North America", "Asia Pacific", "Caribbean", "Gulf Emirates & Middle East"];

export default function QuizPage() {
  const router = useRouter();
  const { t, tValue } = useLanguage();
  
  const [step, setStep] = useState(1);
  const [engagementType, setEngagementType] = useState<string[]>([]);
  const [category, setCategory] = useState<string[]>([]);
  const [geoArea, setGeoArea] = useState<string[]>([]);
  const [compensation, setCompensation] = useState<number>(250);
  
  const [liveCount, setLiveCount] = useState<number>(0);
  const [isCounting, setIsCounting] = useState(false);

  useEffect(() => {
    async function fetchCount() {
      setIsCounting(true);
      const count = await getLiveOpportunitiesCount({
        engagementType: engagementType.length ? engagementType : undefined,
        category: category.length ? category : undefined,
        compensationNumeric: compensation,
        location: geoArea.length ? geoArea : undefined,
      });
      setLiveCount(count);
      setIsCounting(false);
    }
    fetchCount();
  }, [engagementType, category, compensation, geoArea]);

  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[], item: string) => {
    if (list.includes(item)) setter(list.filter((i) => i !== item));
    else setter([...list, item]);
  };

  const handleComplete = () => {
    // Save state to local storage to simulate "gating"
    localStorage.setItem("talentVaultQuizCompleted", "true");
    
    // Convert arrays back to query param format
    const searchParams = new URLSearchParams();
    if(engagementType.length) searchParams.set("engagement", engagementType.join(","));
    if(category.length) searchParams.set("category", category.join(","));
    if(geoArea.length) searchParams.set("geo", geoArea.join(","));
    searchParams.set("compensation", compensation.toString());
    
    router.push(`/opportunities?${searchParams.toString()}`);
  };

  const currentStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="text-2xl font-light text-primary">{t("engagementType")}</h2>
            <div className="flex flex-wrap gap-3">
              {ENGAGEMENT_TYPES.map(tItem => (
                <button 
                  key={tItem}
                  onClick={() => toggleSelection(setEngagementType, engagementType, tItem)}
                  className={`px-5 py-3 rounded-full text-sm transition-all border ${engagementType.includes(tItem) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                >
                  {tValue(tItem)}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="text-2xl font-light text-primary">{t("minimumDayPay")}</h2>
            <div className="pt-8 pb-4">
              <Slider 
                value={[compensation]} 
                min={250} max={5000} step={50} 
                onValueChange={(val) => setCompensation(val[0])} 
              />
            </div>
            <p className="text-right text-muted-foreground">≥ €{compensation}{compensation === 5000 ? '+' : ''} / day</p>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="text-2xl font-light text-primary">{t("operationalContexts")}</h2>
            <div className="flex flex-wrap gap-3">
              {CONTEXTS.map(tItem => (
                <button 
                  key={tItem}
                  onClick={() => toggleSelection(setCategory, category, tItem)}
                  className={`px-5 py-3 rounded-full text-sm transition-all border ${category.includes(tItem) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                >
                  {tValue(tItem)}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="text-2xl font-light text-primary">{t("geographicalArea")}</h2>
            <div className="flex flex-wrap gap-3">
              {GEO_AREAS.map(tArea => (
                <button 
                  key={tArea}
                  onClick={() => toggleSelection(setGeoArea, geoArea, tArea)}
                  className={`px-5 py-3 rounded-full text-sm transition-all border ${geoArea.includes(tArea) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                >
                  {tValue(tArea)}
                </button>
              ))}
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
      {/* Animated Glowing Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
            x: ["0%", "5%", "-5%", "0%"],
            y: ["0%", "-5%", "5%", "0%"],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/30 blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            x: ["0%", "-10%", "5%", "0%"],
            y: ["0%", "10%", "-5%", "0%"],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[30%] -right-[15%] w-[60vw] h-[60vw] rounded-full bg-primary/20 blur-[150px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.15, 0.4, 0.15],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute -bottom-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-white/10 blur-[100px]"
        />
      </div>

      {/* Grid Pattern overlay for tech/premium feel */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none z-0" />

      {/* Shadows / ambient vignette effect */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-0" />

      <div className="w-full max-w-2xl z-10">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight">{t("careerOpportunities")}</h1>
          <p className="text-primary tracking-widest text-sm uppercase">{t("academy")}</p>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 md:p-12 shadow-2xl">
          <AnimatePresence mode="wait">
            {currentStepContent()}
          </AnimatePresence>

          <div className="mt-12 flex items-center justify-between border-t border-border/50 pt-8">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{t("stepPrefix")} {step} {t("stepOf")} 4</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <motion.div 
                key={liveCount}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-right"
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("matching")}</div>
                <div className="text-2xl font-light text-primary">{isCounting ? "..." : liveCount}</div>
              </motion.div>

              {step < 4 ? (
                <button 
                  onClick={() => setStep(s => s + 1)}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-full hover:opacity-90 transition-opacity uppercase text-sm tracking-wider"
                >
                  {t("next")}
                </button>
              ) : (
                <button 
                  onClick={handleComplete}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-full hover:opacity-90 transition-opacity uppercase text-sm tracking-wider"
                >
                  {t("viewOpportunities")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
