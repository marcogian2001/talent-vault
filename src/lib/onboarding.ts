import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { onboardingAnswerFiles, onboardingAnswers, onboardingQuestions } from "@/db/schema";
import { getReview, resolveStage, type ChefStage } from "@/lib/chef-review";
import { isAnswered, type AnswerValue } from "@/lib/onboarding-types";

export type OnboardingQuestion = typeof onboardingQuestions.$inferSelect;
export type OnboardingAnswerFile = typeof onboardingAnswerFiles.$inferSelect;

export interface QuestionWithAnswer {
  question: OnboardingQuestion;
  answerId: string | null;
  value: AnswerValue | null;
  files: OnboardingAnswerFile[];
  answered: boolean;
}

export interface OnboardingStatus {
  requiredTotal: number;
  requiredAnswered: number;
  missing: OnboardingQuestion[];
  isComplete: boolean;
}

const QUESTION_ORDER = [
  asc(onboardingQuestions.sortOrder),
  asc(onboardingQuestions.createdAt),
  asc(onboardingQuestions.id),
];

export async function getActiveQuestions(): Promise<OnboardingQuestion[]> {
  return db
    .select()
    .from(onboardingQuestions)
    .where(eq(onboardingQuestions.status, "active"))
    .orderBy(...QUESTION_ORDER);
}

export async function getQuestionById(id: string): Promise<OnboardingQuestion | undefined> {
  const [row] = await db
    .select()
    .from(onboardingQuestions)
    .where(eq(onboardingQuestions.id, id))
    .limit(1);
  return row;
}

async function loadAnswers(userId: string) {
  const answers = await db
    .select()
    .from(onboardingAnswers)
    .where(eq(onboardingAnswers.userId, userId));

  const files = answers.length
    ? await db
        .select()
        .from(onboardingAnswerFiles)
        .where(
          inArray(
            onboardingAnswerFiles.answerId,
            answers.map((a) => a.id),
          ),
        )
        .orderBy(asc(onboardingAnswerFiles.sortOrder), asc(onboardingAnswerFiles.createdAt))
    : [];

  const filesByAnswer = new Map<string, OnboardingAnswerFile[]>();
  for (const file of files) {
    const list = filesByAnswer.get(file.answerId) ?? [];
    list.push(file);
    filesByAnswer.set(file.answerId, list);
  }

  return { answers, filesByAnswer };
}

/**
 * Completion is always derived, never stored: an admin can add a required question at
 * any moment, and a cached boolean would let a chef through with a missing document.
 */
export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const [questions, { answers, filesByAnswer }] = await Promise.all([
    db
      .select()
      .from(onboardingQuestions)
      .where(and(eq(onboardingQuestions.status, "active"), eq(onboardingQuestions.required, true)))
      .orderBy(...QUESTION_ORDER),
    loadAnswers(userId),
  ]);

  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));
  const missing: OnboardingQuestion[] = [];

  for (const question of questions) {
    const answer = byQuestion.get(question.id);
    const ok = isAnswered(question, {
      value: answer?.value ?? null,
      fileCount: answer ? (filesByAnswer.get(answer.id)?.length ?? 0) : 0,
    });
    if (!ok) missing.push(question);
  }

  return {
    requiredTotal: questions.length,
    requiredAnswered: questions.length - missing.length,
    missing,
    isComplete: missing.length === 0,
  };
}

/** Active questions plus any archived one the chef already answered (kept for the record). */
export async function getQuestionsForUser(userId: string): Promise<QuestionWithAnswer[]> {
  const [questions, { answers, filesByAnswer }] = await Promise.all([
    db.select().from(onboardingQuestions).orderBy(...QUESTION_ORDER),
    loadAnswers(userId),
  ]);

  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));

  return questions
    .filter((q) => q.status === "active" || byQuestion.has(q.id))
    .map((question) => {
      const answer = byQuestion.get(question.id);
      const files = answer ? (filesByAnswer.get(answer.id) ?? []) : [];
      return {
        question,
        answerId: answer?.id ?? null,
        value: answer?.value ?? null,
        files,
        answered: isAnswered(question, {
          value: answer?.value ?? null,
          fileCount: files.length,
        }),
      };
    });
}

/** Batched version for the admin chef list: 3 queries regardless of the page size. */
export async function getOnboardingStatusForUsers(
  userIds: string[],
): Promise<Map<string, OnboardingStatus>> {
  const result = new Map<string, OnboardingStatus>();
  if (userIds.length === 0) return result;

  const questions = await db
    .select()
    .from(onboardingQuestions)
    .where(and(eq(onboardingQuestions.status, "active"), eq(onboardingQuestions.required, true)))
    .orderBy(...QUESTION_ORDER);

  const answers = await db
    .select()
    .from(onboardingAnswers)
    .where(inArray(onboardingAnswers.userId, userIds));

  const fileCounts = answers.length
    ? await db
        .select({ answerId: onboardingAnswerFiles.answerId, total: count() })
        .from(onboardingAnswerFiles)
        .where(
          inArray(
            onboardingAnswerFiles.answerId,
            answers.map((a) => a.id),
          ),
        )
        .groupBy(onboardingAnswerFiles.answerId)
    : [];

  const countByAnswer = new Map(fileCounts.map((f) => [f.answerId, Number(f.total)]));
  const answersByUser = new Map<string, typeof answers>();
  for (const answer of answers) {
    const list = answersByUser.get(answer.userId) ?? [];
    list.push(answer);
    answersByUser.set(answer.userId, list);
  }

  for (const userId of userIds) {
    const byQuestion = new Map((answersByUser.get(userId) ?? []).map((a) => [a.questionId, a]));
    const missing = questions.filter((question) => {
      const answer = byQuestion.get(question.id);
      return !isAnswered(question, {
        value: answer?.value ?? null,
        fileCount: answer ? (countByAnswer.get(answer.id) ?? 0) : 0,
      });
    });

    result.set(userId, {
      requiredTotal: questions.length,
      requiredAnswered: questions.length - missing.length,
      missing,
      isComplete: missing.length === 0,
    });
  }

  return result;
}

/**
 * A rejected chef lands on the profile because that is where the reason is shown and where
 * the answers and documents can be fixed before resubmitting.
 */
const STAGE_PATH: Record<ChefStage, string> = {
  incomplete: "/onboarding",
  pending: "/review",
  rejected: "/profile",
  approved: "/opportunities",
};

export async function getChefStage(userId: string) {
  const [status, review] = await Promise.all([getOnboardingStatus(userId), getReview(userId)]);
  return { stage: resolveStage(status.isComplete, review), status, review };
}

/**
 * The gate used by every chef-facing route. Admins pass through: /admin/* is gated
 * separately by the admin layout, and they have no onboarding to complete or review to wait for.
 */
export async function requireApprovedStudent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  if (session.user.role === "student") {
    const { stage } = await getChefStage(session.user.id);
    if (stage !== "approved") redirect(STAGE_PATH[stage]);
  }

  return session;
}

/** Where a signed-in user belongs right now — used by /, /login and /register. */
export async function studentLandingPath(userId: string, role: string | null | undefined) {
  if (role === "admin") return "/admin";
  const { stage } = await getChefStage(userId);
  return STAGE_PATH[stage];
}
