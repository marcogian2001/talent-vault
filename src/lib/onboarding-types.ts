// Shared between client and server: no `db` import allowed in this file.

export const QUESTION_TYPES = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "single_choice", label: "Single choice" },
  { value: "multi_choice", label: "Multiple choice" },
  { value: "yes_no", label: "Yes / No" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "file", label: "File upload" },
  { value: "files", label: "Multiple files" },
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number]["value"];

export const QUESTION_TYPE_VALUES = QUESTION_TYPES.map((t) => t.value) as [
  QuestionType,
  ...QuestionType[],
];

export const CHOICE_TYPES: QuestionType[] = ["single_choice", "multi_choice"];
export const FILE_TYPES: QuestionType[] = ["file", "files"];

export function isChoiceType(type: string) {
  return CHOICE_TYPES.includes(type as QuestionType);
}

export function isFileType(type: string) {
  return FILE_TYPES.includes(type as QuestionType);
}

export const QUESTION_STATUSES = ["active", "archived"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export interface QuestionOption {
  value: string;
  label: string;
  /** Italian wording; falls back to `label` when the admin has not written one. */
  labelIt?: string | null;
}

/** Mirrors the languages offered by LanguageContext. */
export type AppLanguage = "EN" | "IT";

/**
 * Chef-facing failures travel as codes, not sentences: every value here is also a key in
 * the LanguageContext dictionary, so the browser renders it in the reader's language.
 */
export type OnboardingErrorCode =
  | "signedOutError"
  | "questionRemoved"
  | "uploadNotAccepted"
  | "fileNotYours"
  | "removeCurrentFile"
  | "tooManyFiles"
  | "fileTypeNotAllowed"
  | "fileTooLarge"
  | "fileEmpty"
  | "fileSaveFailed";

/** The translatable half of a question row. */
export interface TranslatableQuestion {
  label: string;
  labelIt?: string | null;
  helpText?: string | null;
  helpTextIt?: string | null;
  placeholder?: string | null;
  placeholderIt?: string | null;
  options?: QuestionOption[] | null;
}

/**
 * Picks the wording for the reader's language, falling back to the authored text
 * whenever a translation is missing — a half-translated questionnaire still reads.
 */
export function localizeQuestion<T extends TranslatableQuestion>(
  question: T,
  language: AppLanguage,
) {
  if (language !== "IT") {
    return {
      label: question.label,
      helpText: question.helpText ?? null,
      placeholder: question.placeholder ?? null,
      options: question.options ?? null,
    };
  }

  return {
    label: question.labelIt?.trim() || question.label,
    helpText: question.helpTextIt?.trim() || question.helpText || null,
    placeholder: question.placeholderIt?.trim() || question.placeholder || null,
    options:
      question.options?.map((option) => ({
        ...option,
        label: option.labelIt?.trim() || option.label,
      })) ?? null,
  };
}

export interface QuestionConfig {
  maxLength?: number;
  min?: number;
  max?: number;
  minSelected?: number;
  maxFiles?: number;
  mustBeFuture?: boolean;
}

// One shape per family of question types. Keeping the discriminant on the stored
// value means a question whose type changed can never be silently misread.
export type AnswerValue =
  | { kind: "text"; text: string } // short_text, long_text
  | { kind: "number"; number: number }
  | { kind: "date"; date: string } // 'YYYY-MM-DD'
  | { kind: "bool"; bool: boolean } // yes_no
  | { kind: "choice"; values: string[] }; // single_choice (length 1), multi_choice

export const DEFAULT_MAX_FILES = 8;
export const SHORT_TEXT_MAX_LENGTH = 200;
export const LONG_TEXT_MAX_LENGTH = 2000;

export function maxFilesFor(question: { type: string; config?: QuestionConfig | null }) {
  if (question.type === "file") return 1;
  return Math.min(question.config?.maxFiles ?? DEFAULT_MAX_FILES, DEFAULT_MAX_FILES);
}

/**
 * The single definition of "this question has been answered".
 *
 * An `onboarding_answers` row only ever exists for a genuinely answered question —
 * clearing an answer deletes the row. File questions carry `value: null` and count
 * as answered when at least one file row is attached.
 */
export function isAnswered(
  question: { type: string },
  answer: { value: AnswerValue | null; fileCount: number } | undefined | null,
): boolean {
  if (!answer) return false;

  if (isFileType(question.type)) return answer.fileCount > 0;

  const value = answer.value;
  if (!value) return false;

  switch (value.kind) {
    case "text":
      return value.text.trim().length > 0;
    case "choice":
      return value.values.length > 0;
    case "number":
      return Number.isFinite(value.number);
    case "date":
      return value.date.length > 0;
    case "bool":
      return typeof value.bool === "boolean";
    default:
      return false;
  }
}

/** Human-readable rendering of a stored answer, used by the admin chef detail page. */
export function formatAnswerValue(
  question: { type: string; options?: QuestionOption[] | null },
  value: AnswerValue | null,
): string[] {
  if (!value) return [];

  switch (value.kind) {
    case "text":
      return [value.text];
    case "number":
      return [String(value.number)];
    case "date":
      return [value.date];
    case "bool":
      return [value.bool ? "Yes" : "No"];
    case "choice":
      return value.values.map(
        (v) => question.options?.find((o) => o.value === v)?.label ?? v,
      );
    default:
      return [];
  }
}
