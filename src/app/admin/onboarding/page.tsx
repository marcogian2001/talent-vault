import Link from "next/link";
import { asc, count } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { onboardingAnswers, onboardingQuestions } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionsTable, { type QuestionRow } from "./QuestionsTable";

export default async function AdminOnboardingPage() {
  const [questions, answerCounts] = await Promise.all([
    db
      .select()
      .from(onboardingQuestions)
      .orderBy(
        asc(onboardingQuestions.sortOrder),
        asc(onboardingQuestions.createdAt),
        asc(onboardingQuestions.id),
      ),
    db
      .select({ questionId: onboardingAnswers.questionId, total: count() })
      .from(onboardingAnswers)
      .groupBy(onboardingAnswers.questionId),
  ]);

  const countByQuestion = new Map(answerCounts.map((row) => [row.questionId, Number(row.total)]));

  const toRows = (status: string): QuestionRow[] =>
    questions
      .filter((question) => question.status === status)
      .map((question) => ({
        question,
        answerCount: countByQuestion.get(question.id) ?? 0,
      }));

  const active = toRows("active");
  const archived = toRows("archived");

  const requiredActive = active.filter((row) => row.question.required).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-tight">Onboarding</h1>
        <Button asChild>
          <Link href="/admin/onboarding/new">
            <Plus />
            New Question
          </Link>
        </Button>
      </div>
      <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
        The questionnaire every chef completes before reaching the opportunities. Required
        questions block access until they are answered; skippable ones can be left for later and
        filled in from the chef&apos;s profile.
      </p>

      <Tabs defaultValue="active">
        <TabsList variant="line" className="mb-5">
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archived.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <QuestionsTable rows={active} />
          {active.length > 0 && (
            <p className="mt-3 px-1 text-xs text-muted-foreground">
              {requiredActive} of {active.length} question{active.length === 1 ? "" : "s"} block
              access to the opportunities.
            </p>
          )}
        </TabsContent>

        <TabsContent value="archived">
          <QuestionsTable rows={archived} archived />
          <p className="mt-3 px-1 text-xs text-muted-foreground">
            Archived questions no longer appear to chefs, but the answers already given are kept.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
