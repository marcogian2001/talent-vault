import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { and, gte, inArray } from "drizzle-orm";
import OpportunitiesClient from "./OpportunitiesClient";
import { LocalizedText } from "@/components/LocalizedText";

interface Props {
  searchParams: Promise<{
    engagement?: string;
    category?: string;
    geo?: string;
    compensation?: string;
  }>;
}

export default async function OpportunitiesPage({ searchParams }: Props) {
  const params = await searchParams;

  const engagementFilters = params.engagement ? params.engagement.split(",") : [];
  const categoryFilters = params.category ? params.category.split(",") : [];
  const compensationNumeric = params.compensation ? parseInt(params.compensation, 10) : undefined;
  // const geoFilters = params.geo ? params.geo.split(",") : [];

  const conditions = [];

  if (engagementFilters.length > 0) {
    conditions.push(inArray(opportunities.engagementType, engagementFilters));
  }
  if (categoryFilters.length > 0) {
    // Some light fuzzy matching or array inclusion. Seed data mapping handled exact strings.
    conditions.push(inArray(opportunities.category, categoryFilters));
  }
  if (compensationNumeric !== undefined && !isNaN(compensationNumeric)) {
    conditions.push(gte(opportunities.compensationNumeric, compensationNumeric));
  }

  const results = await db
    .select()
    .from(opportunities)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return (
    <div className="container mx-auto px-6">
      <div className="mb-12">
        <h1 className="text-3xl font-light tracking-tight mb-2"><LocalizedText tKey="availableOpportunities" /></h1>
        <p className="text-muted-foreground"><LocalizedText tKey="showingResults" params={{ count: results.length }} /></p>
      </div>

      <OpportunitiesClient initialData={results} initialFilters={{
          engagement: engagementFilters,
          category: categoryFilters,
          compensation: compensationNumeric || 250,
      }} />
    </div>
  );
}
