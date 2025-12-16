"use client";

import { Plus, Crown, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CircularGauge } from "@/components/ui/CircularGauge";
import Link from "next/link";
import {
  SubscriptionTier,
  getTierLimits,
  hasReachedPlanLimit,
} from "@/lib/types/subscription";

interface DashboardHeaderProps {
  userName?: string | null;
  userTier: SubscriptionTier;
  planCount: number;
  averageReadinessScore?: number;
  onCreatePlan: () => void;
}

export function DashboardHeader({
  userName,
  userTier,
  planCount,
  averageReadinessScore,
  onCreatePlan,
}: DashboardHeaderProps) {
  const tierLimits = getTierLimits(userTier);
  const atLimit = hasReachedPlanLimit(userTier, planCount);
  const showPlanLimit = userTier === "FREE";

  const displayName = userName || "Prepper";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="mb-8">
      {/* Hero Section with Visual Grounding */}
      <div className="rounded-xl bg-card border border-border p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Welcome + Gauge */}
          <div className="flex items-center gap-5">
            {/* Readiness Gauge */}
            <div className="hidden sm:flex items-center justify-center w-20 h-20 rounded-xl bg-primary/5">
              {averageReadinessScore !== undefined ? (
                <CircularGauge
                  value={averageReadinessScore}
                  size={64}
                  strokeWidth={6}
                />
              ) : (
                <div className="relative">
                  <CircularGauge
                    value={0}
                    size={64}
                    strokeWidth={6}
                    showLabel={false}
                    bgColor="hsl(var(--muted))"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-muted-foreground">
                      --
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Welcome Text */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Welcome back, {firstName}
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
                {planCount === 0
                  ? "Create your first emergency plan to get started"
                  : planCount === 1
                  ? "You have 1 emergency plan"
                  : `You have ${planCount} emergency plans`}
              </p>
            </div>
          </div>

          {/* Right: CTA + Tier Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Tier Badge with Plan Count */}
            {showPlanLimit && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={atLimit ? "destructive" : "secondary"}
                  className="gap-1.5 px-3 py-1.5 font-medium"
                >
                  {atLimit ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Crown className="h-3.5 w-3.5" />
                  )}
                  {planCount}/{tierLimits.maxPlans} Plans
                </Badge>
                {atLimit && (
                  <Link href="/pricing">
                    <Button variant="link" size="sm" className="text-primary p-0 font-medium">
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Trash Link */}
            <Link href="/plans/trash">
              <Button
                size="lg"
                variant="outline"
                className="transition-all hover:scale-[1.02]"
              >
                <Trash2 className="h-5 w-5" />
                Trash
              </Button>
            </Link>

            {/* Create New Plan CTA */}
            <Button
              size="lg"
              onClick={onCreatePlan}
              className="shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              <Plus className="h-5 w-5" />
              Create New Plan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
