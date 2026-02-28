"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GateCheck() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("talentVaultQuizCompleted") !== "true") {
        router.replace("/");
      }
    }
  }, [router]);
  return null;
}
