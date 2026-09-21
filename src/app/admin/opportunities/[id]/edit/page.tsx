import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import OpportunityForm from "../../OpportunityForm";
import OpportunityPageHeader from "../../OpportunityPageHeader";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditOpportunityPage({ params }: Props) {
  const { id } = await params;

  const [opportunity] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1);

  if (!opportunity) notFound();

  return (
    <div>
      <OpportunityPageHeader title="Edit Opportunity" subtitle={opportunity.labelTitle} />
      <OpportunityForm
        opportunityId={opportunity.id}
        defaultValues={{
          category: opportunity.category,
          labelTitle: opportunity.labelTitle,
          imagePath: opportunity.imagePath,
          location: opportunity.location,
          country: opportunity.country ?? undefined,
          engagementType: opportunity.engagementType,
          compensationText: opportunity.compensationText,
          compensationNumeric: opportunity.compensationNumeric ?? undefined,
          currency: opportunity.currency ?? undefined,
          allowCounterProposal: opportunity.allowCounterProposal ?? false,
          position: opportunity.position ?? undefined,
          propertyName: opportunity.propertyName ?? undefined,
          guestCapacity: opportunity.guestCapacity ?? undefined,
          accommodationDetails: opportunity.accommodationDetails ?? undefined,
          benefits: opportunity.benefits ?? undefined,
          vesselName: opportunity.vesselName ?? undefined,
          flag: opportunity.flag ?? undefined,
          crewSize: opportunity.crewSize ?? undefined,
        }}
      />
    </div>
  );
}
