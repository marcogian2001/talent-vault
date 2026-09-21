import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getChefStage, studentLandingPath } from "@/lib/onboarding";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import ReviewPendingCard from "@/components/onboarding/ReviewPendingCard";

export default async function ReviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "student") redirect("/admin");

  // Only a chef who has finished the questionnaire and is waiting for a decision belongs
  // here; everyone else goes where their stage puts them (approved chefs included).
  const { stage } = await getChefStage(session.user.id);
  if (stage !== "pending") redirect(await studentLandingPath(session.user.id, session.user.role));

  return (
    <OnboardingShell>
      <ReviewPendingCard />
    </OnboardingShell>
  );
}
