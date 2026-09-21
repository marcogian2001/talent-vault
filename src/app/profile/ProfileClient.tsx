"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import QuestionField, { type RenderableQuestion } from "@/components/onboarding/QuestionField";
import type { UploadedFile } from "@/components/onboarding/FileUploadField";
import { isFileType, localizeQuestion, type AnswerValue } from "@/lib/onboarding-types";
import { buildAnswerSchema } from "@/lib/onboarding-schema";
import { cn } from "@/lib/utils";
import { resubmitApplicationAction, updateProfileAnswersAction } from "./actions";

export interface ProfileEntry {
  question: RenderableQuestion;
  value: AnswerValue | null;
  files: UploadedFile[];
}

export interface Rejection {
  reason: string;
  flaggedIds: string[];
}

export default function ProfileClient({
  userId,
  entries,
  rejection,
}: {
  userId: string;
  entries: ProfileEntry[];
  /** Set while an admin's rejection is waiting to be answered with a resubmission. */
  rejection: Rejection | null;
}) {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [answers, setAnswers] = useState<Record<string, AnswerValue | null>>(
    Object.fromEntries(entries.map((entry) => [entry.question.id, entry.value])),
  );
  const [files, setFiles] = useState<Record<string, UploadedFile[]>>(
    Object.fromEntries(entries.map((entry) => [entry.question.id, entry.files])),
  );
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Files commit the moment they are uploaded, so they never belong to the save button.
  const valueQuestions = entries.filter((entry) => !isFileType(entry.question.type));
  const fileQuestions = entries.filter((entry) => isFileType(entry.question.type));

  const wording = useMemo(
    () => new Map(entries.map((e) => [e.question.id, localizeQuestion(e.question, language)])),
    [entries, language],
  );

  // Only questions that are still part of the questionnaire can be pointed at.
  const flagged = useMemo(() => new Set(rejection?.flaggedIds ?? []), [rejection]);
  const flaggedEntries = entries.filter((entry) => flagged.has(entry.question.id));

  function setAnswer(questionId: string, value: AnswerValue | null) {
    setError(null);
    setSaved(false);
    setDirty(true);
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  /** Validates and stores the edited answers. Returns whether the chef can move on. */
  async function persist(): Promise<boolean> {
    setError(null);

    // Validated here first so the complaint names the question, and the problem, in the
    // chef's own language. The action re-validates server-side regardless.
    for (const entry of valueQuestions) {
      const label = wording.get(entry.question.id)?.label ?? entry.question.label;
      const answer = answers[entry.question.id] ?? null;

      if (answer === null && entry.question.required) {
        setError(t("cannotClearRequired", { label }));
        return false;
      }

      const parsed = buildAnswerSchema({ ...entry.question, label }, t).safeParse(answer);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t("checkThisAnswer"));
        return false;
      }
    }

    setIsSaving(true);

    const result = await updateProfileAnswersAction(
      Object.fromEntries(valueQuestions.map((entry) => [entry.question.id, answers[entry.question.id] ?? null])),
    );

    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      return false;
    }

    setDirty(false);
    return true;
  }

  async function handleSave() {
    if (!(await persist())) return;
    setSaved(true);
    router.refresh();
  }

  async function handleResubmit() {
    setIsResubmitting(true);

    // Edits that were never saved would otherwise be lost, or reach the admin stale.
    if (dirty && !(await persist())) {
      setIsResubmitting(false);
      return;
    }

    const result = await resubmitApplicationAction();

    if (result.error) {
      setIsResubmitting(false);
      setError(result.error);
      return;
    }

    // Left on so the button cannot be pressed twice while the waiting screen loads.
    router.push("/review");
    router.refresh();
  }

  const flagChip = (
    <span className="ml-2 rounded-full border border-amber-900/50 bg-amber-950/30 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-400">
      {t("needsAttention")}
    </span>
  );

  const blockClass = (questionId: string) =>
    cn(
      "space-y-3",
      flagged.has(questionId) && "rounded-xl border border-amber-900/50 bg-amber-950/10 p-4",
    );

  return (
    <div className="space-y-6">
      {rejection && (
        <Alert variant="error" className="space-y-3 p-4">
          <TriangleAlert />
          <AlertTitle className="line-clamp-none text-base">{t("reviewRejectedTitle")}</AlertTitle>
          <AlertDescription className="gap-3 text-red-200/90">
            <p>{t("reviewRejectedIntro")}</p>
            {rejection.reason && (
              <div className="w-full rounded-lg border border-red-900/40 bg-black/20 p-3">
                <p className="mb-1 text-[10px] uppercase tracking-widest text-red-400">
                  {t("reviewReasonLabel")}
                </p>
                <p className="whitespace-pre-line text-sm text-foreground/90">{rejection.reason}</p>
              </div>
            )}
            {flaggedEntries.length > 0 && (
              <div className="w-full">
                <p className="mb-1 text-[10px] uppercase tracking-widest text-red-400">
                  {t("reviewFlaggedLabel")}
                </p>
                <ul className="list-inside list-disc text-sm text-foreground/90">
                  {flaggedEntries.map((entry) => (
                    <li key={entry.question.id}>{wording.get(entry.question.id)?.label}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {entries.length === 0 && (
        <Card className="rounded-2xl border-dashed border-border/70 bg-card/20 py-12 text-center shadow-none">
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("nothingToFillIn")}</p>
          </CardContent>
        </Card>
      )}

      {valueQuestions.length > 0 && (
        <Card className="gap-5 rounded-2xl border-border/50 bg-card/20 py-6 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium tracking-wide">{t("aboutYou")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-7">
            {valueQuestions.map((entry) => (
              <div key={entry.question.id} className={blockClass(entry.question.id)}>
                <div className="space-y-1">
                  {/* The controls carry their own aria-label; chips have no single form
                      element to point a <label> at. */}
                  <p className="text-sm font-medium">
                    {wording.get(entry.question.id)?.label}
                    {!entry.question.required && (
                      <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground">
                        {t("optional")}
                      </span>
                    )}
                    {flagged.has(entry.question.id) && flagChip}
                  </p>
                  {wording.get(entry.question.id)?.helpText && (
                    <p className="text-xs text-muted-foreground">
                      {wording.get(entry.question.id)?.helpText}
                    </p>
                  )}
                </div>
                <QuestionField
                  question={entry.question}
                  value={answers[entry.question.id] ?? null}
                  onChange={(value) => setAnswer(entry.question.id, value)}
                  files={files[entry.question.id] ?? []}
                  onFilesChange={(next) =>
                    setFiles((prev) => ({ ...prev, [entry.question.id]: next }))
                  }
                  userId={userId}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {fileQuestions.length > 0 && (
        <Card className="gap-5 rounded-2xl border-border/50 bg-card/20 py-6 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium tracking-wide">
              {t("documentsAndCertificates")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-7">
            {fileQuestions.map((entry) => (
              <div key={entry.question.id} className={blockClass(entry.question.id)}>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {wording.get(entry.question.id)?.label}
                    {!entry.question.required && (
                      <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground">
                        {t("optional")}
                      </span>
                    )}
                    {flagged.has(entry.question.id) && flagChip}
                  </p>
                  {wording.get(entry.question.id)?.helpText && (
                    <p className="text-xs text-muted-foreground">
                      {wording.get(entry.question.id)?.helpText}
                    </p>
                  )}
                </div>
                <QuestionField
                  question={entry.question}
                  value={null}
                  onChange={() => {}}
                  files={files[entry.question.id] ?? []}
                  onFilesChange={(next) => {
                    setSaved(false);
                    setFiles((prev) => ({ ...prev, [entry.question.id]: next }));
                    router.refresh();
                  }}
                  userId={userId}
                  onBusyChange={setIsUploading}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">{t("documentsSaveNote")}</p>
          </CardContent>
        </Card>
      )}

      {(valueQuestions.length > 0 || rejection) && (
        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/80 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div aria-live="polite" className="min-w-0 sm:flex-1">
            {error ? (
              <Alert
                variant="error"
                className="py-2 text-destructive *:data-[slot=alert-description]:text-destructive"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : saved ? (
              <p className="px-1 text-sm text-primary">{t("profileUpdated")}</p>
            ) : dirty ? (
              <p className="px-1 text-sm text-muted-foreground">{t("unsavedChanges")}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {valueQuestions.length > 0 && (
              <Button
                variant={rejection ? "outline" : "default"}
                disabled={isSaving || isUploading || isResubmitting || !dirty}
                onClick={() => void handleSave()}
              >
                {isSaving && !isResubmitting && <Loader2 className="animate-spin" />}
                {isSaving && !isResubmitting ? t("saving") : t("saveChanges")}
              </Button>
            )}
            {rejection && (
              <Button
                disabled={isSaving || isUploading || isResubmitting}
                onClick={() => void handleResubmit()}
              >
                {isResubmitting && <Loader2 className="animate-spin" />}
                {isResubmitting ? t("sending") : t("resubmitForReview")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
