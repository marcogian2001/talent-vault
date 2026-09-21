import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { opportunities, applications, user } from "@/db/schema";
import { Card } from "@/components/ui/card";
import { getReviewsForUsers, resolveStage } from "@/lib/chef-review";
import { getOnboardingStatusForUsers } from "@/lib/onboarding";

export default async function AdminDashboardPage() {
  const [[opportunityCount], [applicationCount], [pendingCount], chefs] = await Promise.all([
    db.select({ value: count() }).from(opportunities),
    db.select({ value: count() }).from(applications),
    db.select({ value: count() }).from(applications).where(eq(applications.status, "pending")),
    db.select({ id: user.id }).from(user).where(eq(user.role, "student")),
  ]);

  const chefIds = chefs.map((chef) => chef.id);
  const [statuses, reviews] = await Promise.all([
    getOnboardingStatusForUsers(chefIds),
    getReviewsForUsers(chefIds),
  ]);
  const stages = chefIds.map((id) => resolveStage(statuses.get(id)?.isComplete ?? true, reviews.get(id)));
  const toReviewCount = stages.filter((stage) => stage === "pending").length;
  const approvedCount = stages.filter((stage) => stage === "approved").length;

  const stats = [
    { label: "Opportunities", value: opportunityCount.value, href: "/admin/opportunities" },
    { label: "Applications", value: applicationCount.value, href: "/admin/applications" },
    { label: "Pending Applications", value: pendingCount.value, href: "/admin/applications" },
    { label: "Registered Chefs", value: chefs.length, href: "/admin/chefs" },
    { label: "Chefs to Review", value: toReviewCount, href: "/admin/chefs?status=pending" },
    { label: "Approved Chefs", value: approvedCount, href: "/admin/chefs?status=approved" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-light tracking-tight mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {stats.map((stat) => {
          const tile = (
            <Card className="h-full gap-0 bg-card/30 border-border/50 rounded-2xl p-6 shadow-none hover:border-primary/50 transition-colors">
              <div className="text-3xl font-light text-primary">{stat.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">{stat.label}</div>
            </Card>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="block">{tile}</Link>
          ) : (
            <div key={stat.label}>{tile}</div>
          );
        })}
      </div>
    </div>
  );
}
