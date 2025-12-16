"use client";

import { FileText } from "lucide-react";
import { PlanCard } from "./PlanCard";
import { EmptyPlansState } from "./EmptyPlansState";
import { Badge } from "@/components/ui/badge";
import type { MissionReport } from "@/lib/mission-reports";

interface PlanGridProps {
  plans: MissionReport[];
  onEditPlan: (plan: MissionReport) => void;
  onDeletePlan: (planId: string) => void;
  onCreatePlan: () => void;
}

export function PlanGrid({
  plans,
  onEditPlan,
  onDeletePlan,
  onCreatePlan,
}: PlanGridProps) {
  if (plans.length === 0) {
    return <EmptyPlansState onCreatePlan={onCreatePlan} />;
  }

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Your Emergency Plans
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your preparedness strategies
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm font-medium">
          {plans.length} {plans.length === 1 ? "plan" : "plans"}
        </Badge>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onEdit={onEditPlan}
            onDelete={onDeletePlan}
          />
        ))}
      </div>
    </div>
  );
}
