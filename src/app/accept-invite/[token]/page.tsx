import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminInvites } from "@/db/schema";
import { Card } from "@/components/ui/card";
import AcceptInviteClient from "./AcceptInviteClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function AcceptInvitePage({ params }: Props) {
  const { token } = await params;

  const [invite] = await db
    .select()
    .from(adminInvites)
    .where(eq(adminInvites.token, token))
    .limit(1);

  const isValid = !!invite && invite.status === "pending" && invite.expiresAt > new Date();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="w-full max-w-md">
        {!isValid ? (
          <Card className="gap-3 bg-card/50 border-border/50 rounded-2xl p-8 text-center shadow-none">
            <h1 className="text-xl font-medium text-white">Invalid or Expired Invite</h1>
            <p className="text-muted-foreground text-sm">
              This admin invitation link is no longer valid. Ask your super admin to send a new one.
            </p>
          </Card>
        ) : (
          <AcceptInviteClient token={token} email={invite!.email} />
        )}
      </div>
    </div>
  );
}
