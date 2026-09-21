import { and, asc, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/db";
import { onboardingAnswerFiles, onboardingAnswers } from "@/db/schema";
import { buildAnswerSchema } from "@/lib/onboarding-schema";
import {
  isFileType,
  maxFilesFor,
  type AnswerValue,
  type OnboardingErrorCode,
} from "@/lib/onboarding-types";
import type { OnboardingQuestion } from "@/lib/onboarding";

// A failed blob cleanup only leaves an orphan behind; it must never fail the write that
// triggered it. Same policy as deleteBlobImage in the admin opportunities actions.
async function deleteBlobQuietly(url: string) {
  try {
    await del(url);
  } catch {}
}

async function getAnswerRow(userId: string, questionId: string) {
  const [row] = await db
    .select()
    .from(onboardingAnswers)
    .where(and(eq(onboardingAnswers.userId, userId), eq(onboardingAnswers.questionId, questionId)))
    .limit(1);
  return row;
}

async function upsertAnswerRow(userId: string, questionId: string, value: AnswerValue | null) {
  const [row] = await db
    .insert(onboardingAnswers)
    .values({ id: crypto.randomUUID(), userId, questionId, value })
    .onConflictDoUpdate({
      target: [onboardingAnswers.userId, onboardingAnswers.questionId],
      set: { value, updatedAt: new Date() },
    })
    .returning();
  return row;
}

/**
 * Validates and stores one answer. Passing an empty/null value clears it, which deletes
 * the row: an `onboarding_answers` row exists only for a genuinely answered question.
 */
export async function saveAnswer(
  userId: string,
  question: OnboardingQuestion,
  rawValue: unknown,
): Promise<{ error?: string }> {
  if (isFileType(question.type)) {
    // Files are attached one by one; there is no value to store.
    return {};
  }

  const parsed = buildAnswerSchema(question).safeParse(rawValue ?? null);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? `Invalid answer for "${question.label}"` };
  }

  if (parsed.data === null) {
    await clearAnswer(userId, question.id);
    return {};
  }

  await upsertAnswerRow(userId, question.id, parsed.data);
  return {};
}

export async function clearAnswer(userId: string, questionId: string) {
  const row = await getAnswerRow(userId, questionId);
  if (!row) return;

  const files = await db
    .select()
    .from(onboardingAnswerFiles)
    .where(eq(onboardingAnswerFiles.answerId, row.id));

  // The row cascades to its file rows; the blobs themselves need an explicit delete.
  await db.delete(onboardingAnswers).where(eq(onboardingAnswers.id, row.id));
  await Promise.all(files.map((file) => deleteBlobQuietly(file.url)));
}

export interface UploadedFileMeta {
  url: string;
  pathname: string;
  originalName: string;
  contentType: string;
  size: number;
}

/**
 * Records a file that has already landed in Blob storage. For single-file questions the
 * previous file is replaced (row deleted, blob removed best-effort).
 */
export async function attachFile(
  userId: string,
  question: OnboardingQuestion,
  meta: UploadedFileMeta,
): Promise<{ code?: OnboardingErrorCode; fileId?: string }> {
  const answer = (await getAnswerRow(userId, question.id)) ?? (await upsertAnswerRow(userId, question.id, null));

  const existing = await db
    .select()
    .from(onboardingAnswerFiles)
    .where(eq(onboardingAnswerFiles.answerId, answer.id))
    .orderBy(asc(onboardingAnswerFiles.sortOrder), asc(onboardingAnswerFiles.createdAt));

  const limit = maxFilesFor(question);
  const replacing = question.type === "file" ? existing : [];

  if (!replacing.length && existing.length >= limit) {
    return { code: limit === 1 ? "removeCurrentFile" : "tooManyFiles" };
  }

  const id = crypto.randomUUID();
  await db.insert(onboardingAnswerFiles).values({
    id,
    answerId: answer.id,
    url: meta.url,
    pathname: meta.pathname,
    originalName: meta.originalName,
    contentType: meta.contentType,
    size: meta.size,
    sortOrder: existing.length ? (existing[existing.length - 1].sortOrder ?? 0) + 10 : 0,
  });

  for (const old of replacing) {
    await db.delete(onboardingAnswerFiles).where(eq(onboardingAnswerFiles.id, old.id));
    await deleteBlobQuietly(old.url);
  }

  await db
    .update(onboardingAnswers)
    .set({ updatedAt: new Date() })
    .where(eq(onboardingAnswers.id, answer.id));

  return { fileId: id };
}

export async function removeFile(
  userId: string,
  fileId: string,
): Promise<{ code?: OnboardingErrorCode }> {
  const [row] = await db
    .select({
      file: onboardingAnswerFiles,
      answerId: onboardingAnswers.id,
      ownerId: onboardingAnswers.userId,
    })
    .from(onboardingAnswerFiles)
    .innerJoin(onboardingAnswers, eq(onboardingAnswerFiles.answerId, onboardingAnswers.id))
    .where(eq(onboardingAnswerFiles.id, fileId))
    .limit(1);

  if (!row || row.ownerId !== userId) {
    return { code: "fileNotYours" };
  }

  await db.delete(onboardingAnswerFiles).where(eq(onboardingAnswerFiles.id, fileId));
  await deleteBlobQuietly(row.file.url);

  // Last file gone means the question is unanswered again — drop the empty row.
  const [remaining] = await db
    .select({ id: onboardingAnswerFiles.id })
    .from(onboardingAnswerFiles)
    .where(eq(onboardingAnswerFiles.answerId, row.answerId))
    .limit(1);

  if (!remaining) {
    await db.delete(onboardingAnswers).where(eq(onboardingAnswers.id, row.answerId));
  }

  return {};
}
