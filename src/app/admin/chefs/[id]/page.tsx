import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, opportunities, user } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getChefStage, getQuestionsForUser, type QuestionWithAnswer } from "@/lib/onboarding";
import { formatAnswerValue, isFileType } from "@/lib/onboarding-types";
import { formatFileSize } from "@/lib/onboarding-upload";
import StageBadge from "../StageBadge";
import ReviewPanel from "./ReviewPanel";

export default async function ChefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [chef] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  if (!chef || chef.role !== "student") notFound();

  const [{ stage, status, review }, entries, chefApplications] = await Promise.all([
    getChefStage(chef.id),
    getQuestionsForUser(chef.id),
    db
      .select({
        id: applications.id,
        status: applications.status,
        createdAt: applications.createdAt,
        opportunityTitle: opportunities.labelTitle,
      })
      .from(applications)
      .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .where(eq(applications.studentUserId, chef.id))
      .orderBy(desc(applications.createdAt)),
  ]);

  const active = entries.filter((entry) => entry.question.status === "active");
  const archived = entries.filter((entry) => entry.question.status === "archived");

  // Labels rather than ids, and looked up among every question: a flagged one may have been
  // archived since the rejection.
  const labelById = new Map(entries.map((entry) => [entry.question.id, entry.question.label]));
  const flaggedLabels = (review?.flaggedQuestionIds ?? []).flatMap((id) => labelById.get(id) ?? []);

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/chefs"
          className="mb-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to chefs
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-light tracking-tight">{chef.name}</h1>
          <StageBadge
            stage={stage}
            detail={
              stage === "incomplete"
                ? `${status.requiredAnswered} / ${status.requiredTotal} required answered`
                : undefined
            }
          />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {chef.email} · registered {chef.createdAt.toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-6">
        <ReviewPanel
          chefId={chef.id}
          chefName={chef.name}
          stage={stage}
          reason={review?.rejectionReason ?? null}
          flaggedLabels={flaggedLabels}
          reviewedAt={review?.reviewedAt?.toLocaleDateString() ?? null}
          resubmittedAt={
            review?.status === "pending" ? (review.resubmittedAt?.toLocaleDateString() ?? null) : null
          }
          questions={active.map((entry) => ({ id: entry.question.id, label: entry.question.label }))}
        />

        <Card className="gap-5 rounded-2xl border-border/50 bg-card/20 py-6 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium tracking-wide">
              Qualification questionnaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {active.length === 0 && (
              <p className="text-sm text-muted-foreground">No questions are published yet.</p>
            )}
            {active.map((entry) => (
              <AnswerBlock key={entry.question.id} entry={entry} />
            ))}
          </CardContent>
        </Card>

        {archived.length > 0 && (
          <Card className="gap-5 rounded-2xl border-border/50 bg-card/10 py-6 shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-medium tracking-wide text-muted-foreground">
                Archived questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {archived.map((entry) => (
                <AnswerBlock key={entry.question.id} entry={entry} />
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="gap-5 rounded-2xl border-border/50 bg-card/20 py-6 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium tracking-wide">
              Applications ({chefApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {chefApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              chefApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border/50 px-4 py-3"
                >
                  <span className="text-sm">{application.opportunityTitle}</span>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {application.status}
                  </span>
                </div>
              ))
            )}
            {chefApplications.length > 0 && (
              <Button asChild variant="link" size="sm" className="px-1">
                <Link href="/admin/applications">Open applications</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnswerBlock({ entry }: { entry: QuestionWithAnswer }) {
  const { question, value, files, answered } = entry;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <p className="text-sm font-medium">{question.label}</p>
        {!question.required && (
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Optional
          </span>
        )}
      </div>

      {!answered ? (
        <p className="text-sm text-muted-foreground italic">Not answered</p>
      ) : isFileType(question.type) ? (
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.id}>
              <a
                href={`/api/onboarding/files/${file.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary"
              >
                <FileText className="size-4 shrink-0 text-primary" />
                <span className="max-w-xs truncate">{file.originalName}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : question.type === "multi_choice" || question.type === "single_choice" ? (
        <div className="flex flex-wrap gap-2">
          {formatAnswerValue(question, value).map((label) => (
            <Badge
              key={label}
              variant="outline"
              className="border-primary/30 bg-primary/10 font-normal text-primary"
            >
              {label}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="whitespace-pre-line text-sm text-foreground/90">
          {formatAnswerValue(question, value).join(", ")}
        </p>
      )}
    </div>
  );
}
