import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChefStage } from "@/lib/chef-review";

const STYLES: Record<ChefStage, string> = {
  incomplete: "border-amber-900/50 bg-amber-950/30 text-amber-400",
  pending: "border-blue-900/50 bg-blue-950/30 text-blue-400",
  approved: "border-primary/40 bg-primary/20 text-primary",
  rejected: "border-red-900/50 bg-red-950/30 text-red-400",
};

const LABELS: Record<ChefStage, string> = {
  incomplete: "Onboarding incomplete",
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function StageBadge({
  stage,
  detail,
  className,
}: {
  stage: ChefStage;
  /** Replaces the label, e.g. the answered/required count of an unfinished questionnaire. */
  detail?: string;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("font-normal", STYLES[stage], className)}>
      {detail ?? LABELS[stage]}
    </Badge>
  );
}
