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
    next: "Next",
    viewOpportunities: "View Opportunities",
    academy: "A.N. Sushi Academy",
    engagementType: "Engagement Type",
    profile: "Profile",
    chefProfile: "Chef Profile",
    chefQualification: "Chef Qualification",
    yes: "Yes",
    no: "No",
    selectAnOption: "Select an option",
    answerRequired: "This answer is required to continue.",
    stillMissing: "Still missing",
    newQuestionsBanner:
      "We've added new questions to your chef profile. Complete them to keep browsing the opportunities.",
    documentsSaveNote: "Documents are saved as soon as they finish uploading.",
    profileUpdated: "Profile updated.",
    unsavedChanges: "Unsaved changes",
    aboutYou: "About you",
    documentsAndCertificates: "Documents & certificates",
    dragAndDrop: "Drag & drop or click to upload",
    replaceThisFile: "Replace this file",
    uploadHint: "PDF, JPG, PNG, WebP or HEIC · max {max}",
    uploadedCount: "{count}/{max} uploaded",
    uploading: "Uploading…",
    removeFile: "Remove {name}",
    maxFilesReached: "Maximum of {max} files reached. Remove one to upload another.",
    fileTypeNotAllowed: "Only PDF, JPG, PNG, WebP or HEIC files are allowed.",
    fileTooLarge: "The file is too large (max {max}).",
    fileEmpty: "The file appears to be empty.",
    fileSaveFailed: "The file could not be saved. Please try again.",
    uploadFailed: "Upload failed. Please try again.",
    uploadUnreachable:
      "We couldn't reach the upload service. Files up to {max} can still be sent, but this one is larger — try a smaller file or try again later.",
    checkThisAnswer: "Please check this answer.",
    nothingToCompleteTitle: "Nothing to complete yet",
    nothingToCompleteBody:
      "The qualification questionnaire has not been set up. You can browse the opportunities in the meantime.",
    nothingToFillIn: "There is nothing to fill in yet — the academy has not published the questionnaire.",
    unsupportedQuestion: "This question type is not supported by your version of the app.",
    backToOpportunities: "Back to Opportunities",
    myApplications: "My Applications",
    signedOutError: "You are no longer signed in. Please sign in again.",
    questionRemoved: "This question is no longer part of the questionnaire.",
    uploadNotAccepted: "This question does not accept uploads.",
    fileNotYours: "That file does not belong to this question.",
    removeCurrentFile: "Remove the current file before uploading a new one.",
    tooManyFiles: "You can upload at most {max} files for this question.",
    fieldRequired: "{label} is required",
    fieldTooLong: "{label} must be at most {max} characters",
    fieldNotANumber: "{label} must be a number",
    fieldNotWhole: "{label} must be a whole number",
    fieldMin: "{label} must be at least {min}",
    fieldMax: "{label} must be at most {max}",
    fieldInvalidDate: "{label} must be a valid date",
    fieldFutureDate: "{label} must be a future date",
    fieldSelectOne: "Select one option for \"{label}\"",
    fieldSelectAtLeast: "Select at least {min} for \"{label}\"",
    cannotClearRequired: "\"{label}\" is required and cannot be left empty.",
    saveChanges: "Save Changes",
    saving: "Saving...",
    answered: "Answered",
    optional: "Optional",
    skipForNow: "Skip for now",
    back: "Back",
    finish: "Finish",
    reviewPendingTitle: "Your application is under review",
    reviewPendingBody:
      "Our team is checking your answers and documents. Once your application is approved you will be able to browse the opportunities available for your experience.",
    reviewPendingEmailNote: "We will email you as soon as there is an update.",
    reviewRejectedTitle: "Your application was not approved",
    reviewRejectedIntro:
      "Read the note below, update your answers and documents, then send your application for review again.",
    reviewReasonLabel: "Note from the reviewer",
    reviewFlaggedLabel: "Please check these items",
    needsAttention: "Needs attention",
    resubmitForReview: "Save and resubmit for review",
    sending: "Sending..."
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
    next: "Avanti",
    viewOpportunities: "Vedi Opportunità",
    academy: "A.N. Sushi Academy",
    engagementType: "Tipo di Ingaggio",
    profile: "Profilo",
    chefProfile: "Profilo Chef",
    chefQualification: "Qualifica Chef",
    yes: "Sì",
    no: "No",
    selectAnOption: "Seleziona un'opzione",
    answerRequired: "Questa risposta è obbligatoria per continuare.",
    stillMissing: "Mancano ancora",
    newQuestionsBanner:
      "Abbiamo aggiunto nuove domande al tuo profilo chef. Completale per continuare a vedere le opportunità.",
    documentsSaveNote: "I documenti vengono salvati appena finisce il caricamento.",
    profileUpdated: "Profilo aggiornato.",
    unsavedChanges: "Modifiche non salvate",
    aboutYou: "Chi sei",
    documentsAndCertificates: "Documenti e attestati",
    dragAndDrop: "Trascina qui il file o clicca per caricarlo",
    replaceThisFile: "Sostituisci questo file",
    uploadHint: "PDF, JPG, PNG, WebP o HEIC · max {max}",
    uploadedCount: "{count}/{max} caricati",
    uploading: "Caricamento…",
    removeFile: "Rimuovi {name}",
    maxFilesReached: "Hai raggiunto il massimo di {max} file. Rimuovine uno per caricarne un altro.",
    fileTypeNotAllowed: "Sono ammessi solo file PDF, JPG, PNG, WebP o HEIC.",
    fileTooLarge: "Il file è troppo grande (max {max}).",
    fileEmpty: "Il file sembra vuoto.",
    fileSaveFailed: "Non è stato possibile salvare il file. Riprova.",
    uploadFailed: "Caricamento non riuscito. Riprova.",
    uploadUnreachable:
      "Non riusciamo a raggiungere il servizio di caricamento. Si possono comunque inviare file fino a {max}, ma questo è più grande: prova con un file più piccolo o riprova più tardi.",
    checkThisAnswer: "Controlla questa risposta.",
    nothingToCompleteTitle: "Non c'è ancora nulla da completare",
    nothingToCompleteBody:
      "Il questionario di qualifica non è ancora stato impostato. Intanto puoi vedere le opportunità.",
    nothingToFillIn: "Non c'è ancora nulla da compilare: l'accademia non ha pubblicato il questionario.",
    unsupportedQuestion: "Questo tipo di domanda non è supportato dalla tua versione dell'app.",
    backToOpportunities: "Torna alle Opportunità",
    myApplications: "Le mie candidature",
    signedOutError: "La sessione è scaduta. Accedi di nuovo.",
    questionRemoved: "Questa domanda non fa più parte del questionario.",
    uploadNotAccepted: "Questa domanda non accetta caricamenti.",
    fileNotYours: "Questo file non appartiene a questa domanda.",
    removeCurrentFile: "Rimuovi il file attuale prima di caricarne uno nuovo.",
    tooManyFiles: "Per questa domanda puoi caricare al massimo {max} file.",
    fieldRequired: "{label} è obbligatorio",
    fieldTooLong: "{label} può contenere al massimo {max} caratteri",
    fieldNotANumber: "{label} deve essere un numero",
    fieldNotWhole: "{label} deve essere un numero intero",
    fieldMin: "{label} deve essere almeno {min}",
    fieldMax: "{label} può essere al massimo {max}",
    fieldInvalidDate: "{label} deve essere una data valida",
    fieldFutureDate: "{label} deve essere una data futura",
    fieldSelectOne: "Seleziona un'opzione per \"{label}\"",
    fieldSelectAtLeast: "Seleziona almeno {min} per \"{label}\"",
    cannotClearRequired: "\"{label}\" è obbligatorio e non può restare vuoto.",
    saveChanges: "Salva Modifiche",
    saving: "Salvataggio...",
    answered: "Completate",
    optional: "Facoltativa",
    skipForNow: "Salta per ora",
    back: "Indietro",
    finish: "Completa",
    reviewPendingTitle: "La tua candidatura è in fase di revisione",
    reviewPendingBody:
      "Il nostro team sta controllando le tue risposte e i tuoi documenti. Una volta approvata la candidatura potrai visionare le opportunità disponibili in base alla tua esperienza.",
    reviewPendingEmailNote: "Ti scriveremo via email appena ci sarà un aggiornamento.",
    reviewRejectedTitle: "La tua candidatura non è stata approvata",
    reviewRejectedIntro:
      "Leggi il messaggio qui sotto, aggiorna le risposte e i documenti, poi invia di nuovo la candidatura per la revisione.",
    reviewReasonLabel: "Messaggio del revisore",
    reviewFlaggedLabel: "Controlla questi punti",
    needsAttention: "Da correggere",
    resubmitForReview: "Salva e invia di nuovo per la revisione",
    sending: "Invio in corso..."
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
    // Values come from the database (categories, engagement types), so a key with no
    // translation is expected: fall back to the value as stored.
    const dictionary: Record<string, string> = valueTranslations[language];
    return dictionary[key] || key;
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
