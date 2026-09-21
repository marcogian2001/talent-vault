"use client";

import { motion } from "framer-motion";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SignOutButton from "@/components/SignOutButton";

/** The ambient background the qualification flow has always used, shared with the review screens. */
export default function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
            x: ["0%", "5%", "-5%", "0%"],
            y: ["0%", "-5%", "5%", "0%"],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] h-[50vw] w-[50vw] rounded-full bg-primary/30 blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            x: ["0%", "-10%", "5%", "0%"],
            y: ["0%", "10%", "-5%", "0%"],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[30%] -right-[15%] h-[60vw] w-[60vw] rounded-full bg-primary/20 blur-[150px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute -bottom-[20%] left-[20%] h-[40vw] w-[40vw] rounded-full bg-white/10 blur-[100px]"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

      <div className="z-10 w-full max-w-2xl py-12">
        {/* Switches the interface copy. The questions themselves are authored by the
            academy in a single language. Sign out lives here too so a chef is never stuck
            in the flow on someone else's account. */}
        <div className="mb-4 flex items-center justify-end gap-2">
          <LanguageSwitcher />
          <SignOutButton />
        </div>
        {children}
      </div>
    </div>
  );
}
