import { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/opportunities");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/admin" className="text-sm font-light tracking-wider text-foreground">
            Talent Vault <span className="text-primary">/ Admin</span>
          </Link>
          <nav className="flex items-center gap-6 text-xs uppercase tracking-widest text-muted-foreground">
            <Link href="/admin/opportunities" className="hover:text-foreground transition-colors">Opportunities</Link>
            <Link href="/admin/applications" className="hover:text-foreground transition-colors">Applications</Link>
            <Link href="/admin/chefs" className="hover:text-foreground transition-colors">Chefs</Link>
            <Link href="/admin/onboarding" className="hover:text-foreground transition-colors">Onboarding</Link>
            {session.user.isSuperAdmin && (
              <Link href="/admin/team" className="hover:text-foreground transition-colors">Team</Link>
            )}
            <Link href="/opportunities" className="hover:text-foreground transition-colors">View Site</Link>
          </nav>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 container mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
