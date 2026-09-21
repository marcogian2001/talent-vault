import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, opportunities } from "@/db/schema";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusSelect from "./StatusSelect";

export default async function AdminApplicationsPage() {
  const rows = await db
    .select({
      id: applications.id,
      type: applications.type,
      status: applications.status,
      proposedCompensation: applications.proposedCompensation,
      createdAt: applications.createdAt,
      studentName: applications.name,
      studentEmail: applications.email,
      opportunityTitle: opportunities.labelTitle,
    })
    .from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .orderBy(desc(applications.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-light tracking-tight mb-8">Applications</h1>
      <Card className="gap-0 overflow-hidden rounded-2xl border-border/50 bg-card/20 py-0 shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-medium">{row.studentName}</div>
                  <div className="text-xs text-muted-foreground">{row.studentEmail}</div>
                </TableCell>
                <TableCell>{row.opportunityTitle}</TableCell>
                <TableCell className="capitalize">{row.type}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.proposedCompensation ? `Proposed: ${row.proposedCompensation}` : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : ""}
                </TableCell>
                <TableCell>
                  <StatusSelect applicationId={row.id} status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 && (
          <p className="text-center text-muted-foreground py-16">No applications yet.</p>
        )}
      </Card>
    </div>
  );
}
