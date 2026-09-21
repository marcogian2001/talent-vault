import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getChefStage, getQuestionsForUser } from "@/lib/onboarding";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SignOutButton from "@/components/SignOutButton";
import { LocalizedText } from "@/components/LocalizedText";
import ProfileClient, { type ProfileEntry } from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "student") redirect("/admin");

  // One flow at a time: an incomplete chef belongs in the guided onboarding, and one whose
  // application is being reviewed has nothing to change until the decision comes back.
  const { stage, review } = await getChefStage(session.user.id);
  if (stage === "incomplete") redirect("/onboarding");
  if (stage === "pending") redirect("/review");

  const approved = stage === "approved";
  const entries = await getQuestionsForUser(session.user.id);

  const active: ProfileEntry[] = entries
    .filter((entry) => entry.question.status === "active")
    .map((entry) => ({
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
    }));

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          {/* Both destinations are behind the approval gate, so a rejected chef gets no link. */}
          {approved ? (
            <Link
              href="/opportunities"
              className="text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              ← <LocalizedText tKey="backToOpportunities" />
            </Link>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-6">
            {approved && (
              <Link
                href="/applications"
                className="hidden text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
              >
                <LocalizedText tKey="myApplications" />
              </Link>
            )}
            <LanguageSwitcher />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-light tracking-tight">
            <LocalizedText tKey="chefProfile" />
          </h1>
          <p className="text-sm text-muted-foreground">
            {session.user.name} · {session.user.email}
          </p>
        </div>

        <ProfileClient
          userId={session.user.id}
          entries={active}
          rejection={
            stage === "rejected"
              ? {
                  reason: review?.rejectionReason ?? "",
                  flaggedIds: review?.flaggedQuestionIds ?? [],
                }
              : null
          }
        />
      </main>
    </div>
  );
}
