import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import GateCheck from "@/components/GateCheck";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { LocalizedText } from "@/components/LocalizedText";

export default function OpportunitiesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <GateCheck />
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
            <LanguageSwitcher />
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
