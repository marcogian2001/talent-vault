import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { requireApprovedStudent } from "@/lib/onboarding";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SignOutButton from "@/components/SignOutButton";
import { LocalizedText } from "@/components/LocalizedText";

export default async function OpportunitiesLayout({ children }: { children: ReactNode }) {
  // Redirects to /login, to /onboarding while a required question is unanswered, or to the
  // review screens until an admin has approved the chef.
  const session = await requireApprovedStudent();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Navbar Minimal */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 relative grayscale opacity-70">
              <Image src="/photos/logo.png" alt="A.N. Sushi Academy" fill className="object-contain" />
            </div>
            <span className="font-light tracking-wider text-sm text-foreground"><LocalizedText tKey="academy" /></span>
          </Link>
          <div className="flex items-center space-x-6">
            <span className="text-primary text-xs uppercase tracking-widest hidden md:inline-block"><LocalizedText tKey="talentVault" /></span>
            <Link href="/applications" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block">
              My Applications
            </Link>
            {session.user.role === "student" && (
              <Link href="/profile" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block">
                <LocalizedText tKey="profile" />
              </Link>
            )}
            {session.user.role === "admin" && (
              <Link href="/admin" className="text-xs uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
                Admin
              </Link>
            )}
            <LanguageSwitcher />
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content Space */}
      <main className="flex-1 pt-24 pb-16">
        {children}
      </main>
    </div>
  );
}
