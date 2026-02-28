"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "EN" | "IT";

const translations = {
  EN: {
    talentVault: "Talent Vault",
    availableOpportunities: "Available Opportunities",
    showingResults: "Showing {count} results matching your profile.",
    minimumPay: "Minimum Pay",
    category: "Category",
    engagement: "Engagement",
    dayRatePrefix: "≥ €",
    dayRateSuffix: " / day",
    opportunitiesVisible: "{count} opportunities visible",
    cardEngagement: "Engagement",
    cardCompensation: "Compensation",
    cardGuests: "Guests",
    cardAccommodation: "Accommodation",
    applyNow: "Apply Now",
    counterProposal: "Counter Proposal",
    noOpportunities: "No opportunities found",
    tryWidening: "Try widening your filters to see more results.",
    stepPrefix: "Step",
    stepOf: "of",
    matching: "Matching",
    next: "Next",
    viewOpportunities: "View Opportunities",
    careerOpportunities: "Career Opportunities",
    academy: "A.N. Sushi Academy",
    geographicalArea: "Geographical Area",
    engagementType: "Engagement Type",
    operationalContexts: "Operational Contexts",
    minimumDayPay: "Minimum Day Pay Limit"
  },
  IT: {
    talentVault: "Talent Vault",
    availableOpportunities: "Opportunità Disponibili",
    showingResults: "Mostrando {count} risultati corrispondenti al tuo profilo.",
    minimumPay: "Paga Minima",
    category: "Categoria",
    engagement: "Ingaggio",
    dayRatePrefix: "≥ €",
    dayRateSuffix: " / giorno",
    opportunitiesVisible: "{count} opportunità visibili",
    cardEngagement: "Ingaggio",
    cardCompensation: "Compenso",
    cardGuests: "Ospiti",
    cardAccommodation: "Alloggio",
    applyNow: "Candidati Ora",
    counterProposal: "Controproposta",
    noOpportunities: "Nessuna opportunità trovata",
    tryWidening: "Prova ad ampliare i filtri per vedere più risultati.",
    stepPrefix: "Passo",
    stepOf: "di",
    matching: "Corrispondono",
    next: "Avanti",
    viewOpportunities: "Vedi Opportunità",
    careerOpportunities: "Opportunità di Carriera",
    academy: "A.N. Sushi Academy",
    geographicalArea: "Area Geografica",
    engagementType: "Tipo di Ingaggio",
    operationalContexts: "Contesti Operativi",
    minimumDayPay: "Limite di Paga Giornaliera Minima"
  }
};

const valueTranslations = {
  EN: {
    "Private Residency": "Private Residency",
    "Private Yacht": "Private Yacht",
    "Expedition Cruises": "Expedition Cruises",
    "Luxury Resort": "Luxury Resort",
    "Fine Dining Omakase": "Fine Dining Omakase",
    "Single Service": "Single Service",
    "Seasonal": "Seasonal",
    "Appointment": "Appointment",
    "Permanent Position": "Permanent Position",
    "Global": "Global",
    "North Europe": "North Europe",
    "Mediterranean": "Mediterranean",
    "North America": "North America",
    "Asia Pacific": "Asia Pacific",
    "Caribbean": "Caribbean",
    "Gulf Emirates & Middle East": "Gulf Emirates & Middle East"
  },
  IT: {
    "Private Residency": "Residenza Privata",
    "Private Yacht": "Yacht Privato",
    "Expedition Cruises": "Crociere Spedizione",
    "Luxury Resort": "Resort di Lusso",
    "Fine Dining Omakase": "Fine Dining Omakase",
    "Single Service": "Servizio Singolo",
    "Seasonal": "Stagionale",
    "Appointment": "Su Appuntamento",
    "Permanent Position": "Posizione Permanente",
    "Global": "Globale",
    "North Europe": "Nord Europa",
    "Mediterranean": "Mediterraneo",
    "North America": "Nord America",
    "Asia Pacific": "Asia Pacifico",
    "Caribbean": "Caraibi",
    "Gulf Emirates & Middle East": "Emirati del Golfo & Medio Oriente"
  }
};

type TranslatableKeys = keyof typeof translations.EN;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslatableKeys, params?: Record<string, string | number>) => string;
  tValue: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("EN");

  const t = (key: TranslatableKeys, params?: Record<string, string | number>) => {
    let str = translations[language][key];
    if (params) {
      Object.keys(params).forEach(p => {
        str = str.replace(`{${p}}`, params[p].toString());
      });
    }
    return str;
  };

  const tValue = (key: string) => {
    // @ts-ignore
    return valueTranslations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tValue }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
