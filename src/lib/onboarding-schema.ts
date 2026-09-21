import { z } from "zod";
import {
  LONG_TEXT_MAX_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
  type AnswerValue,
  type QuestionConfig,
  type QuestionOption,
} from "./onboarding-types";

/**
 * Keys the validator needs from the translation dictionary. The browser passes
 * LanguageContext's `t` so a chef reads the complaint in their own language; the server
 * falls back to English, which is what the admin panel and the logs want anyway.
 */
export type FieldMessageKey =
  | "fieldRequired"
  | "fieldTooLong"
  | "fieldNotANumber"
  | "fieldNotWhole"
  | "fieldMin"
  | "fieldMax"
  | "fieldInvalidDate"
  | "fieldFutureDate"
  | "fieldSelectOne"
  | "fieldSelectAtLeast";

export type FieldMessages = (
  key: FieldMessageKey,
  params?: Record<string, string | number>,
) => string;

const ENGLISH_MESSAGES: Record<FieldMessageKey, string> = {
  fieldRequired: "{label} is required",
  fieldTooLong: "{label} must be at most {max} characters",
  fieldNotANumber: "{label} must be a number",
  fieldNotWhole: "{label} must be a whole number",
  fieldMin: "{label} must be at least {min}",
  fieldMax: "{label} must be at most {max}",
  fieldInvalidDate: "{label} must be a valid date",
  fieldFutureDate: "{label} must be a future date",
  fieldSelectOne: 'Select one option for "{label}"',
  fieldSelectAtLeast: 'Select at least {min} for "{label}"',
};

const defaultMessages: FieldMessages = (key, params) => {
  let text = ENGLISH_MESSAGES[key];
  for (const [name, value] of Object.entries(params ?? {})) {
    text = text.replace(`{${name}}`, String(value));
  }
  return text;
};

// The minimum a question row has to expose for its schema to be built. The server
// always passes the row straight from the database, never a client-supplied shape.
export interface QuestionShape {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: QuestionOption[] | null;
  config?: QuestionConfig | null;
}

function optionValues(question: QuestionShape): [string, ...string[]] {
  const values = (question.options ?? []).map((o) => o.value).filter(Boolean);
  // z.enum needs a non-empty tuple; a choice question without options can never
  // be satisfied, so an impossible placeholder is the correct behaviour.
  return values.length ? (values as [string, ...string[]]) : ["__no_options__"];
}

/**
 * Builds the validator for a single answer. Returns a schema over `AnswerValue | null`,
 * where `null` means "not answered" and is only accepted for optional questions.
 *
 * File questions are validated by their attached file rows, not here, so they accept
 * `null` unconditionally — `isAnswered` is what gates them.
 */
export function buildAnswerSchema(
  question: QuestionShape,
  messages: FieldMessages = defaultMessages,
): z.ZodType<AnswerValue | null> {
  const config = question.config ?? {};
  const label = question.label;
  const m = (key: FieldMessageKey, params: Record<string, string | number> = {}) =>
    messages(key, { label, ...params });

  let schema: z.ZodType<AnswerValue>;

  switch (question.type) {
    case "short_text":
    case "long_text": {
      const max =
        config.maxLength ??
        (question.type === "long_text" ? LONG_TEXT_MAX_LENGTH : SHORT_TEXT_MAX_LENGTH);
      schema = z.object(
        {
          kind: z.literal("text"),
          text: z
            .string()
            .trim()
            .min(1, m("fieldRequired"))
            .max(max, m("fieldTooLong", { max })),
        },
        // Covers the "no answer at all" case, where zod would otherwise report its own
        // "expected object, received null" in English.
        { error: m("fieldRequired") },
      );
      break;
    }

    case "number": {
      let num = z.number({ message: m("fieldNotANumber") }).int(m("fieldNotWhole"));
      if (config.min !== undefined) num = num.min(config.min, m("fieldMin", { min: config.min }));
      if (config.max !== undefined) num = num.max(config.max, m("fieldMax", { max: config.max }));
      schema = z.object(
        { kind: z.literal("number"), number: num },
        { error: m("fieldRequired") },
      );
      break;
    }

    case "date": {
      const base = z.iso.date(m("fieldInvalidDate"));
      const date: z.ZodType<string> = config.mustBeFuture
        ? base.refine(
            (value) => value > new Date().toISOString().slice(0, 10),
            m("fieldFutureDate"),
          )
        : base;
      schema = z.object({ kind: z.literal("date"), date }, { error: m("fieldRequired") });
      break;
    }

    case "yes_no":
      schema = z.object(
        { kind: z.literal("bool"), bool: z.boolean() },
        { error: m("fieldRequired") },
      );
      break;

    case "single_choice":
      schema = z.object(
        {
          kind: z.literal("choice"),
          values: z.array(z.enum(optionValues(question))).length(1, m("fieldSelectOne")),
        },
        { error: m("fieldSelectOne") },
      );
      break;

    case "multi_choice": {
      const min = Math.max(config.minSelected ?? 1, 1);
      schema = z.object(
        {
          kind: z.literal("choice"),
          values: z
            .array(z.enum(optionValues(question)))
            .min(min, m("fieldSelectAtLeast", { min })),
        },
        { error: m("fieldSelectAtLeast", { min }) },
      );
      break;
    }

    case "file":
    case "files":
      // Files live in their own table; the value column stays null.
      return z.null();

    default:
      return z.null();
  }

  return question.required
    ? (schema as z.ZodType<AnswerValue | null>)
    : (schema.nullable() as z.ZodType<AnswerValue | null>);
}

/** Validates a whole `{ [questionId]: AnswerValue | null }` map, used by the profile form. */
export function buildAnswersSchema(questions: QuestionShape[], messages?: FieldMessages) {
  const shape: Record<string, z.ZodType<AnswerValue | null>> = {};
  for (const question of questions) {
    shape[question.id] = buildAnswerSchema(question, messages);
  }
  return z.object(shape);
}
