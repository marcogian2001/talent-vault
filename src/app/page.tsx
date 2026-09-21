import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { studentLandingPath } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // A chef with an unfinished questionnaire is sent to it rather than bounced off
  // /opportunities.
  const primaryHref = !session
    ? "/register"
    : await studentLandingPath(session.user.id, session.user.role);

  const primaryLabel = !session
    ? "Get Started"
    : session.user.role === "admin"
      ? "Go to Admin Dashboard"
      : "View Opportunities";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
      {/* Animated Glowing Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute top-[30%] -right-[15%] w-[60vw] h-[60vw] rounded-full bg-primary/20 blur-[150px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-white/10 blur-[100px]" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none z-0" />
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-3xl text-center space-y-10">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 relative grayscale opacity-80">
            <Image src="/photos/logo.png" alt="A.N. Sushi Academy" fill className="object-contain" />
          </div>
          <p className="text-primary tracking-widest text-sm uppercase">A.N. Sushi Academy</p>
          <h1 className="text-5xl md:text-6xl font-light tracking-tight text-white">Talent Vault</h1>
          <p className="text-muted-foreground max-w-xl text-balance">
            The private marketplace for elite hospitality talent — private residencies, yachts,
            expedition cruises, luxury resorts and fine dining. Register, complete your chef
            qualification profile, and unlock every opportunity matching your experience.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="pill"
            className="font-normal hover:bg-primary hover:opacity-90 transition-opacity"
          >
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          {!session && (
            <Button
              asChild
              variant="outline"
              size="pill"
              className="border-border bg-transparent font-normal text-foreground shadow-none hover:bg-card hover:text-foreground transition-colors"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
