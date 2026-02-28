"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// Hack to get the keys
type TranslatableKeys = Parameters<ReturnType<typeof useLanguage>["t"]>[0];

export function LocalizedText({ 
  tKey, 
  params 
}: { 
  tKey: TranslatableKeys; 
  params?: Record<string, string | number>;
}) {
  const { t } = useLanguage();
  return <>{t(tKey, params)}</>;
}

export function LocalizedValue({ valKey }: { valKey: string }) {
  const { tValue } = useLanguage();
  return <>{tValue(valKey)}</>;
}
