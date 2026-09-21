import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { onboardingAnswers, onboardingQuestions } from "@/db/schema";
import { isChoiceType } from "@/lib/onboarding-types";
import OnboardingPageHeader from "../../OnboardingPageHeader";
import QuestionForm from "../../QuestionForm";
import type { QuestionFormValues } from "../../schema";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditQuestionPage({ params }: Props) {
  const { id } = await params;

  const [question] = await db
    .select()
    .from(onboardingQuestions)
    .where(eq(onboardingQuestions.id, id))
    .limit(1);

  if (!question) notFound();

  const [answerTotals] = await db
    .select({ total: count() })
    .from(onboardingAnswers)
    .where(eq(onboardingAnswers.questionId, id));

  const answerCount = Number(answerTotals?.total ?? 0);

  // Options a chef has actually picked can be renamed but not removed, otherwise their
  // stored answer would point at nothing.
  let lockedOptionValues: string[] = [];
  if (isChoiceType(question.type) && answerCount > 0) {
    const answers = await db
      .select({ value: onboardingAnswers.value })
      .from(onboardingAnswers)
      .where(eq(onboardingAnswers.questionId, id));

    const used = new Set<string>();
    for (const answer of answers) {
      if (answer.value?.kind === "choice") {
        for (const value of answer.value.values) used.add(value);
      }
    }
    lockedOptionValues = [...used];
  }

  const config = question.config ?? {};
  const defaultValues: Partial<QuestionFormValues> = {
    type: question.type as QuestionFormValues["type"],
    label: question.label,
    helpText: question.helpText ?? "",
    placeholder: question.placeholder ?? "",
    labelIt: question.labelIt ?? "",
    helpTextIt: question.helpTextIt ?? "",
    placeholderIt: question.placeholderIt ?? "",
    required: question.required,
    // The form schema uses optional (not nullable) strings, so null becomes undefined.
    options: (question.options ?? []).map((option) => ({
      value: option.value,
      label: option.label,
      labelIt: option.labelIt ?? undefined,
    })),
    maxLength: config.maxLength,
    min: config.min,
    max: config.max,
    maxFiles: config.maxFiles,
    mustBeFuture: config.mustBeFuture ?? false,
  };

  return (
    <div>
      <OnboardingPageHeader title="Edit Question" subtitle={question.label} />
      <QuestionForm
        questionId={question.id}
        answerCount={answerCount}
        lockedOptionValues={lockedOptionValues}
        defaultValues={defaultValues}
      />
    </div>
  );
}
