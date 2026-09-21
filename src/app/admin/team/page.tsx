import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, adminInvites } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import InviteForm from "./InviteForm";

export default async function AdminTeamPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (!session.user.isSuperAdmin) redirect("/admin");

  const [admins, invites] = await Promise.all([
    db.select().from(user).where(eq(user.role, "admin")).orderBy(desc(user.createdAt)),
    db.select().from(adminInvites).where(eq(adminInvites.status, "pending")).orderBy(desc(adminInvites.createdAt)),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-light tracking-tight mb-8">Team</h1>
        <InviteForm />
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Admins</h2>
        <div className="space-y-2">
          {admins.map((a) => (
            <Card key={a.id} className="flex-row items-center justify-between gap-0 bg-card/20 border-border/50 rounded-xl px-4 py-3 shadow-none">
              <div>
                <div className="font-medium">
                  {a.name}
                  {a.isSuperAdmin && (
                    <Badge variant="outline" className="ml-2 inline border-primary/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                      Super Admin
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{a.email}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {invites.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Pending Invites</h2>
          <div className="space-y-2">
            {invites.map((inv) => (
              <Card key={inv.id} className="flex-row items-center justify-between gap-0 bg-card/20 border-border/50 rounded-xl px-4 py-3 shadow-none">
                <div className="text-sm">{inv.email}</div>
                <div className="text-xs text-muted-foreground">Expires {new Date(inv.expiresAt).toLocaleDateString()}</div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
