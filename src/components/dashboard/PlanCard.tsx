"use client";

import { Pencil, Trash2, ArrowRight, MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularGauge } from "@/components/ui/CircularGauge";
import Link from "next/link";
import type { MissionReport } from "@/lib/mission-reports";

interface PlanCardProps {
  plan: MissionReport;
  onEdit: (plan: MissionReport) => void;
  onDelete: (planId: string) => void;
}

export function PlanCard({ plan, onEdit, onDelete }: PlanCardProps) {
  const readinessScore = plan.readinessScore ?? 0;
  const scenarios = plan.scenarios || [];

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this plan?")) {
      onDelete(plan.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(plan);
  };

  return (
    <Card className="group hover:border-primary/40 hover:shadow-lg transition-all duration-200 overflow-hidden">
      <CardContent className="p-0">
        {/* Card Header with Actions */}
        <div className="p-4 pb-3">
          {/* Top Row: Badges + Actions */}
          <div className="flex items-start justify-between gap-2 mb-3">
            {/* Scenario Badges */}
            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
              {scenarios.length > 0 ? (
                <>
                  {scenarios.slice(0, 2).map((scenario, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs truncate max-w-[120px] bg-primary/10 text-primary border-0 font-medium"
                    >
                      {scenario}
                    </Badge>
                  ))}
                  {scenarios.length > 2 && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      +{scenarios.length - 2}
                    </Badge>
                  )}
                </>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-xs bg-muted/50 font-medium"
                >
                  General
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleEdit}
                aria-label="Edit plan title"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                aria-label="Delete plan"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Title */}
          <h3
            className="font-semibold text-base text-foreground mb-2 truncate leading-tight"
            title={plan.title}
          >
            {plan.title}
          </h3>

          {/* Meta Info */}
          <div className="space-y-1">
            {plan.location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{plan.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{formatDate(plan.updatedAt || plan.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Footer: Score + View - Elevated Background */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 dark:bg-muted/30">
          {/* Readiness Score */}
          <div className="flex items-center gap-2.5">
            <CircularGauge
              value={readinessScore}
              size={36}
              strokeWidth={4}
              showLabel={false}
            />
            <div className="leading-tight">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                Readiness
              </p>
              <p
                className={`text-sm font-bold ${
                  readinessScore >= 70
                    ? "text-success"
                    : readinessScore >= 40
                    ? "text-warning"
                    : "text-destructive"
                }`}
              >
                {readinessScore}%
              </p>
            </div>
          </div>

          {/* View Plan Link */}
          <Link href={`/plans/${plan.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary hover:bg-primary/10 font-medium"
            >
              View
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
