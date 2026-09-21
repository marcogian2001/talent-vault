import Link from "next/link";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QUESTION_TYPES, type QuestionType } from "@/lib/onboarding-types";
import type { OnboardingQuestion } from "@/lib/onboarding";
import ReorderButtons from "./ReorderButtons";
import { QuestionDangerAction, RestoreQuestionButton } from "./QuestionRowActions";

export interface QuestionRow {
  question: OnboardingQuestion;
  answerCount: number;
}

const TYPE_LABELS = new Map<string, string>(
  QUESTION_TYPES.map((t) => [t.value as QuestionType, t.label]),
);

export default function QuestionsTable({
  rows,
  archived = false,
}: {
  rows: QuestionRow[];
  archived?: boolean;
}) {
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border/50 bg-card/20 py-0 shadow-none">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            {!archived && <TableHead className="h-11 w-14 px-4" />}
            <TableHead className="h-11 px-4 text-xs uppercase tracking-wider text-muted-foreground">
              Question
            </TableHead>
            <TableHead className="h-11 px-4 text-xs uppercase tracking-wider text-muted-foreground">
              Type
            </TableHead>
            <TableHead className="h-11 px-4 text-xs uppercase tracking-wider text-muted-foreground">
              Answering
            </TableHead>
            <TableHead className="h-11 px-4 text-xs uppercase tracking-wider text-muted-foreground">
              Answers
            </TableHead>
            <TableHead className="h-11 px-4 text-right text-xs uppercase tracking-wider text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ question, answerCount }, index) => (
            <TableRow key={question.id} className="hover:bg-muted/30">
              {!archived && (
                <TableCell className="px-2 py-3">
                  <ReorderButtons
                    id={question.id}
                    isFirst={index === 0}
                    isLast={index === rows.length - 1}
                  />
                </TableCell>
              )}

              <TableCell className="max-w-md px-4 py-3">
                <div className="font-medium">{question.label}</div>
                {question.helpText && (
                  <div className="mt-0.5 text-xs text-muted-foreground">{question.helpText}</div>
                )}
              </TableCell>

              <TableCell className="px-4 py-3">
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 font-normal text-primary"
                >
                  {TYPE_LABELS.get(question.type) ?? question.type}
                </Badge>
              </TableCell>

              <TableCell className="px-4 py-3">
                {question.required ? (
                  <span className="text-xs uppercase tracking-wider text-foreground/80">
                    Required
                  </span>
                ) : (
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Skippable
                  </span>
                )}
              </TableCell>

              <TableCell className="px-4 py-3 text-muted-foreground">{answerCount}</TableCell>

              <TableCell className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {archived ? (
                    <RestoreQuestionButton id={question.id} />
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="bg-transparent text-xs uppercase tracking-wider text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    >
                      <Link href={`/admin/onboarding/${question.id}/edit`}>
                        <Pencil />
                        Edit
                      </Link>
                    </Button>
                  )}

                  {!archived && (
                    <QuestionDangerAction
                      id={question.id}
                      label={question.label}
                      mode="archive"
                      answerCount={answerCount}
                    />
                  )}

                  <QuestionDangerAction
                    id={question.id}
                    label={question.label}
                    mode="delete"
                    answerCount={answerCount}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {rows.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          {archived ? (
            <p>No archived questions.</p>
          ) : (
            <>
              <p>No questions yet — chefs would reach the opportunities straight away.</p>
              <Button asChild variant="link" size="sm" className="mt-2">
                <Link href="/admin/onboarding/new">Add the first question</Link>
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
