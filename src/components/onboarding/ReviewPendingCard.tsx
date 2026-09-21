import { Hourglass } from "lucide-react";
import { LocalizedText } from "@/components/LocalizedText";
import { Card } from "@/components/ui/card";

/** What a chef sees between finishing the questionnaire and an admin's decision. */
export default function ReviewPendingCard() {
  return (
    <>
      <div className="mb-10 space-y-4 text-center">
        <p className="text-sm uppercase tracking-widest text-primary">
          <LocalizedText tKey="academy" />
        </p>
      </div>

      <Card className="items-center gap-0 rounded-2xl border-border/50 bg-card/50 p-8 text-center shadow-2xl backdrop-blur-xl md:p-12">
        <div className="mb-6 flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
          <Hourglass className="size-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-light text-primary md:text-3xl">
          <LocalizedText tKey="reviewPendingTitle" />
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          <LocalizedText tKey="reviewPendingBody" />
        </p>
        <p className="mt-3 text-xs text-muted-foreground/80">
          <LocalizedText tKey="reviewPendingEmailNote" />
        </p>
      </Card>
    </>
  );
}
