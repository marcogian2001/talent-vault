"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import QuestionField, { type RenderableQuestion } from "@/components/onboarding/QuestionField";
import type { UploadedFile } from "@/components/onboarding/FileUploadField";
import { buildAnswerSchema } from "@/lib/onboarding-schema";
import { isAnswered, localizeQuestion, type AnswerValue } from "@/lib/onboarding-types";
import { completeOnboardingAction, saveOnboardingAnswerAction } from "./actions";

export interface OnboardingStep {
  question: RenderableQuestion;
  value: AnswerValue | null;
  files: UploadedFile[];
  answered: boolean;
}

interface Props {
  userId: string;
  steps: OnboardingStep[];
  startIndex: number;
  resuming: boolean;
}

export default function OnboardingClient({ userId, steps, startIndex, resuming }: Props) {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [index, setIndex] = useState(Math.min(startIndex, Math.max(steps.length - 1, 0)));
  const [answers, setAnswers] = useState<(AnswerValue | null)[]>(steps.map((s) => s.value));
  const [files, setFiles] = useState<UploadedFile[][]>(steps.map((s) => s.files));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (steps.length === 0) {
    return (
      <OnboardingShell>
        <Card className="gap-0 rounded-2xl border-border/50 bg-card/50 p-8 shadow-2xl backdrop-blur-xl md:p-12">
          <h2 className="text-2xl font-light text-primary">{t("nothingToCompleteTitle")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{t("nothingToCompleteBody")}</p>
          <Button size="pill" className="mt-8 self-start py-3 font-normal" onClick={() => router.push("/opportunities")}>
            {t("viewOpportunities")}
          </Button>
        </Card>
      </OnboardingShell>
    );
  }

  const step = steps[index];
  const question = step.question;
  // A plain call, not the hook: this sits after the early return for an empty
  // questionnaire, and hooks may not run conditionally.
  const localized = localizeQuestion(question, language);
  const value = answers[index];
  const stepFiles = files[index];
  const isLast = index === steps.length - 1;
  const answeredNow = isAnswered(question, { value, fileCount: stepFiles.length });

  function setAnswer(next: AnswerValue | null) {
    setError(null);
    setAnswers((prev) => prev.map((a, i) => (i === index ? next : a)));
  }

  function setStepFiles(next: UploadedFile[]) {
    setError(null);
    setFiles((prev) => prev.map((f, i) => (i === index ? next : f)));
  }

  async function goForward(skip = false) {
    setError(null);

    // Files are already persisted as they are uploaded; only value answers need saving.
    if (!skip && !isFileQuestion(question.type)) {
      if (question.required || value !== null) {
        // Both the label and the complaint itself are in the chef's language.
        const parsed = buildAnswerSchema(
          { ...question, label: localized.label },
          t,
        ).safeParse(value);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? t("checkThisAnswer"));
          return;
        }
      }

      setIsSaving(true);
      const result = await saveOnboardingAnswerAction(question.id, value);
      setIsSaving(false);

      if (result.code || result.error) {
        setError(result.code ? t(result.code) : (result.error ?? t("checkThisAnswer")));
        return;
      }
    }

    if (!skip && question.required && !answeredNow) {
      setError(t("answerRequired"));
      return;
    }

    if (!isLast) {
      setIndex(index + 1);
      return;
    }

    setIsSaving(true);
    const result = await completeOnboardingAction();
    setIsSaving(false);

    if (result.error) {
      const missing = result.missingIds ?? [];
      // The action names the missing questions in their authored language; rebuild the
      // list here so it reads in the language the chef is using.
      const missingLabels = steps
        .filter((s) => missing.includes(s.question.id))
        .map((s) => localizeQuestion(s.question, language).label);

      setError(
        missingLabels.length ? `${t("stillMissing")}: ${missingLabels.join(", ")}` : result.error,
      );

      const jumpTo = steps.findIndex((s) => missing.includes(s.question.id));
      if (jumpTo >= 0) setIndex(jumpTo);
      return;
    }

    router.push("/opportunities");
    router.refresh();
  }

  const answeredCount = steps.filter((s, i) =>
    isAnswered(s.question, { value: answers[i], fileCount: files[i].length }),
  ).length;

  return (
    <OnboardingShell>
      <div className="mb-10 space-y-4 text-center">
        <h1 className="text-4xl font-light tracking-tight md:text-5xl">
          {t("chefQualification")}
        </h1>
        <p className="text-sm uppercase tracking-widest text-primary">{t("academy")}</p>
      </div>

      {resuming && index === startIndex && (
        <Alert className="mb-6 border-primary/40 bg-primary/10">
          <AlertDescription className="text-sm text-foreground/90">
            {t("newQuestionsBanner")}
          </AlertDescription>
        </Alert>
      )}

      <Card className="gap-0 rounded-2xl border-border/50 bg-card/50 p-8 shadow-2xl backdrop-blur-xl md:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-light text-primary">{localized.label}</h2>
              {localized.helpText && (
                <p className="text-sm text-muted-foreground">{localized.helpText}</p>
              )}
              {!question.required && (
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t("optional")}
                </p>
              )}
            </div>

            <QuestionField
              question={question}
              value={value}
              onChange={setAnswer}
              files={stepFiles}
              onFilesChange={setStepFiles}
              userId={userId}
              onBusyChange={setIsUploading}
              autoFocus
            />

            <div aria-live="polite">
              {error && (
                <Alert variant="error">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* The bar gets its own line so it keeps a usable width whatever the question
            count or the language; the label never wraps and the actions wrap below it
            on narrow screens instead of spilling out of the card. */}
        <div className="mt-12 space-y-4 border-t border-border/50 pt-8">
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={t("answered")}
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={steps.length}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${(answeredCount / steps.length) * 100}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <span className="whitespace-nowrap text-xs uppercase tracking-wider text-muted-foreground">
              {t("stepPrefix")} {index + 1} {t("stepOf")} {steps.length}
              <span className="mx-2 text-muted-foreground/50">·</span>
              <span className="tabular-nums text-primary" title={t("answered")}>
                {answeredCount}/{steps.length}
              </span>
            </span>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {index > 0 && (
                <Button
                  variant="ghost"
                  className="h-auto rounded-full px-4 py-3 text-xs font-normal uppercase tracking-wider"
                  disabled={isSaving || isUploading}
                  onClick={() => {
                    setError(null);
                    setIndex(index - 1);
                  }}
                >
                  {t("back")}
                </Button>
              )}

              {!question.required && (
                <Button
                  variant="ghost"
                  className="h-auto rounded-full px-4 py-3 text-xs font-normal uppercase tracking-wider text-muted-foreground"
                  disabled={isSaving || isUploading}
                  onClick={() => void goForward(true)}
                >
                  {t("skipForNow")}
                </Button>
              )}

              <Button
                size="pill"
                className="py-3 font-normal transition-opacity hover:bg-primary hover:opacity-90"
                disabled={isSaving || isUploading}
                onClick={() => void goForward()}
              >
                {isSaving ? "..." : isLast ? t("finish") : t("next")}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </OnboardingShell>
  );
}

function isFileQuestion(type: string) {
  return type === "file" || type === "files";
}
