import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { studentLandingPath } from "@/lib/onboarding";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect(await studentLandingPath(session.user.id, session.user.role));
  }

  return <LoginForm />;
}
