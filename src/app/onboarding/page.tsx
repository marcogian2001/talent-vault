import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOnboardingStatus, getQuestionsForUser, studentLandingPath } from "@/lib/onboarding";
import OnboardingClient, { type OnboardingStep } from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "student") redirect("/admin");

  // Finished chefs go wherever their review puts them: the waiting screen, the profile to
  // fix a rejection, or the opportunities.
  const status = await getOnboardingStatus(session.user.id);
  if (status.isComplete) redirect(await studentLandingPath(session.user.id, session.user.role));

  const entries = await getQuestionsForUser(session.user.id);
  const active = entries.filter((entry) => entry.question.status === "active");

  const steps: OnboardingStep[] = active.map((entry) => ({
    question: {
      id: entry.question.id,
      type: entry.question.type,
      label: entry.question.label,
      helpText: entry.question.helpText,
      placeholder: entry.question.placeholder,
      labelIt: entry.question.labelIt,
      helpTextIt: entry.question.helpTextIt,
      placeholderIt: entry.question.placeholderIt,
      required: entry.question.required,
      options: entry.question.options,
      config: entry.question.config,
    },
    value: entry.value,
    files: entry.files.map((file) => ({
      id: file.id,
      originalName: file.originalName,
      contentType: file.contentType,
      size: file.size,
    })),
    answered: entry.answered,
  }));

  // Someone who had already finished and is here again only because an admin added a
  // question should be told why, and dropped straight on the first unanswered step.
  const hasAnswers = steps.some((step) => step.answered);
  const firstUnanswered = Math.max(
    0,
    steps.findIndex((step) => !step.answered),
  );

  return (
    <OnboardingClient
      userId={session.user.id}
      steps={steps}
      startIndex={firstUnanswered}
      resuming={hasAnswers}
    />
  );
}
