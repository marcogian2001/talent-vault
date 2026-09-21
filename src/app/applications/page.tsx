import Image from "next/image";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { requireApprovedStudent } from "@/lib/onboarding";
import { db } from "@/db";
import { applications, opportunities } from "@/db/schema";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SignOutButton from "@/components/SignOutButton";
import { LocalizedText } from "@/components/LocalizedText";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted/50 text-muted-foreground border-border/50",
  reviewing: "bg-blue-950/30 text-blue-400 border-blue-900/50",
  accepted: "bg-primary/20 text-primary border-primary/40",
  rejected: "bg-red-950/30 text-red-400 border-red-900/50",
};

export default async function MyApplicationsPage() {
  // Same gate as the opportunities: no browsing until an admin has approved the chef.
  const session = await requireApprovedStudent();

  const rows = await db
    .select({
      id: applications.id,
      type: applications.type,
      status: applications.status,
      proposedCompensation: applications.proposedCompensation,
      availabilityWindow: applications.availabilityWindow,
      createdAt: applications.createdAt,
      opportunityTitle: opportunities.labelTitle,
      opportunityCategory: opportunities.category,
      opportunityImage: opportunities.imagePath,
      opportunityCompensation: opportunities.compensationText,
    })
    .from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .where(eq(applications.studentUserId, session.user.id))
    .orderBy(desc(applications.createdAt));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/opportunities" className="text-sm font-light tracking-wider text-foreground hover:opacity-80 transition-opacity">
            ← Back to Opportunities
          </Link>
          <div className="flex items-center space-x-4">
            {session.user.role === "student" && (
              <Link
                href="/profile"
                className="hidden text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
              >
                <LocalizedText tKey="profile" />
              </Link>
            )}
            <LanguageSwitcher />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-light tracking-tight mb-2">My Applications</h1>
          <p className="text-muted-foreground">Track the status of every application and counter-proposal you have submitted.</p>
        </div>

        {rows.length === 0 ? (
          <Card className="w-full gap-0 py-32 text-center rounded-2xl border-dashed border-border/50 bg-transparent shadow-none">
            <h3 className="text-lg text-muted-foreground">You haven&apos;t applied to anything yet</h3>
            <Button asChild variant="link" className="mt-2 h-auto self-center p-0 font-normal">
              <Link href="/opportunities">Browse opportunities →</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <Card key={row.id} className="flex-row items-center gap-5 bg-card/20 border-border/50 rounded-2xl p-4 shadow-none">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <Image src={row.opportunityImage} alt={row.opportunityTitle} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-medium truncate">{row.opportunityTitle}</h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-2.5 py-1 text-[10px] font-normal uppercase tracking-widest",
                        STATUS_STYLES[row.status] ?? STATUS_STYLES.pending
                      )}
                    >
                      {row.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {row.type === "counter" ? "Counter Proposal" : "Application"} · {row.opportunityCategory}
                    {row.proposedCompensation ? ` · Proposed: ${row.proposedCompensation}` : ` · ${row.opportunityCompensation}`}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : ""}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
