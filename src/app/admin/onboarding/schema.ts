import { z } from "zod";
import {
  DEFAULT_MAX_FILES,
  QUESTION_TYPE_VALUES,
  isChoiceType,
  isFileType,
} from "@/lib/onboarding-types";

const optionSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, "Option value is required")
    .max(40)
    .regex(/^[a-z0-9_]+$/, "Option values may only contain lowercase letters, numbers and underscores"),
  label: z.string().trim().min(1, "Option label is required").max(120),
  labelIt: z.string().trim().max(120).optional(),
});

export const questionFormSchema = z
  .object({
    type: z.enum(QUESTION_TYPE_VALUES),
    label: z.string().trim().min(1, "Question text is required").max(300),
    helpText: z.string().trim().max(500).optional(),
    placeholder: z.string().trim().max(120).optional(),
    labelIt: z.string().trim().max(300).optional(),
    helpTextIt: z.string().trim().max(500).optional(),
    placeholderIt: z.string().trim().max(120).optional(),
    required: z.boolean(),
    options: z.array(optionSchema).optional(),
    maxLength: z.number().int().min(1).max(5000).optional(),
    min: z.number().int().optional(),
    max: z.number().int().optional(),
    maxFiles: z.number().int().min(1).max(DEFAULT_MAX_FILES).optional(),
    mustBeFuture: z.boolean().optional(),
  })
  .superRefine((values, ctx) => {
    if (isChoiceType(values.type)) {
      const options = values.options ?? [];
      if (options.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Add at least two options",
        });
      }
      const seen = new Set<string>();
      options.forEach((option, index) => {
        if (seen.has(option.value)) {
          ctx.addIssue({
            code: "custom",
            path: ["options", index, "value"],
            message: "Option values must be unique",
          });
        }
        seen.add(option.value);
      });
    }

    if (values.type === "number" && values.min !== undefined && values.max !== undefined) {
      if (values.min > values.max) {
        ctx.addIssue({
          code: "custom",
          path: ["max"],
          message: "Maximum must be greater than the minimum",
        });
      }
    }

    if (values.type === "files" && values.maxFiles === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["maxFiles"],
        message: "Set how many files can be uploaded",
      });
    }
  });

export type QuestionFormValues = z.infer<typeof questionFormSchema>;

/** Strips the config fields that do not apply to the chosen type before storing. */
export function toQuestionConfig(values: QuestionFormValues) {
  const config: Record<string, number | boolean> = {};

  if (values.type === "short_text" || values.type === "long_text") {
    if (values.maxLength !== undefined) config.maxLength = values.maxLength;
  }
  if (values.type === "number") {
    if (values.min !== undefined) config.min = values.min;
    if (values.max !== undefined) config.max = values.max;
  }
  if (values.type === "date" && values.mustBeFuture) {
    config.mustBeFuture = true;
  }
  if (values.type === "files" && values.maxFiles !== undefined) {
    config.maxFiles = values.maxFiles;
  }

  return Object.keys(config).length ? config : null;
}

export function toQuestionOptions(values: QuestionFormValues) {
  return isChoiceType(values.type) ? (values.options ?? []) : null;
}

export function typeUsesOptions(type: string) {
  return isChoiceType(type);
}

export function typeUsesFiles(type: string) {
  return isFileType(type);
}
