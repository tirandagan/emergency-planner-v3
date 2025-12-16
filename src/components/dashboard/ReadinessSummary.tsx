"use client";

import { Target, Lock, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CircularGauge } from "@/components/ui/CircularGauge";
import Link from "next/link";

interface ReadinessSummaryProps {
  /** When true, shows skeleton/placeholder UI for Phase 6 preview */
  isPlaceholder?: boolean;
  /** Aggregated readiness score (0-100) - used when not placeholder */
  overallScore?: number;
  /** Scenario breakdown scores - used when not placeholder */
  scenarioScores?: {
    scenario: string;
    score: number;
    label: string;
  }[];
  /** Top gaps/missing items - used when not placeholder */
  topGaps?: {
    item: string;
    severity: "critical" | "warning" | "info";
  }[];
}

const PLACEHOLDER_SCENARIOS = [
  { scenario: "natural-disaster", label: "Natural Disaster", score: 0 },
  { scenario: "pandemic", label: "Pandemic", score: 0 },
  { scenario: "grid-down", label: "Grid Down", score: 0 },
  { scenario: "civil-unrest", label: "Civil Unrest", score: 0 },
];

export function ReadinessSummary({
  isPlaceholder = true,
  overallScore = 0,
  scenarioScores = PLACEHOLDER_SCENARIOS,
  topGaps = [],
}: ReadinessSummaryProps) {
  if (isPlaceholder) {
    return (
      <Card className="mb-8 border-dashed">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Readiness Summary</CardTitle>
              <Badge variant="outline" className="text-xs font-normal">
                Coming Soon
              </Badge>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardDescription>
            Detailed readiness analysis and improvement recommendations will be
            available in Phase 6
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Aggregated Score Skeleton */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-dashed">
              <div className="relative">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground/50">
                    --
                  </span>
                </div>
              </div>
              <Skeleton className="h-4 w-24 mt-3" />
              <p className="text-xs text-muted-foreground mt-2">Overall Score</p>
            </div>

            {/* Scenario Breakdown Skeleton */}
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <span>Scenario Breakdown</span>
              </p>
              <div className="space-y-4">
                {PLACEHOLDER_SCENARIOS.map((scenario) => (
                  <div key={scenario.scenario} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {scenario.label}
                      </span>
                      <Skeleton className="h-4 w-10" />
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <Skeleton className="h-full w-0 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Gaps Skeleton */}
          <div className="mt-6 pt-6 border-t border-dashed">
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Top Gaps to Address
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-7 w-28 rounded-full"
                />
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" disabled className="gap-2">
              <Lock className="h-4 w-4" />
              Calculate Readiness Score
            </Button>
            <Link href="/readiness">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Learn more about Readiness
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Real implementation for when Phase 6 is ready
  return (
    <Card className="mb-8">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Readiness Summary</CardTitle>
          </div>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardDescription>
          Your overall emergency preparedness across all scenarios
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Aggregated Score */}
          <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg">
            <CircularGauge value={overallScore} size={96} strokeWidth={10} />
            <p className="text-sm font-medium mt-3">Overall Readiness</p>
            <p className="text-xs text-muted-foreground">
              {overallScore >= 70
                ? "Well Prepared"
                : overallScore >= 40
                ? "Partially Ready"
                : "Needs Attention"}
            </p>
          </div>

          {/* Scenario Breakdown */}
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-muted-foreground mb-4">
              Scenario Breakdown
            </p>
            <div className="space-y-4">
              {scenarioScores.map((scenario) => (
                <div key={scenario.scenario} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{scenario.label}</span>
                    <span
                      className={
                        scenario.score >= 70
                          ? "text-success"
                          : scenario.score >= 40
                          ? "text-warning"
                          : "text-destructive"
                      }
                    >
                      {scenario.score}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        scenario.score >= 70
                          ? "bg-success"
                          : scenario.score >= 40
                          ? "bg-warning"
                          : "bg-destructive"
                      }`}
                      style={{ width: `${scenario.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Gaps */}
        {topGaps.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Top Gaps to Address
            </p>
            <div className="flex flex-wrap gap-2">
              {topGaps.map((gap, index) => (
                <Badge
                  key={index}
                  variant={
                    gap.severity === "critical"
                      ? "destructive"
                      : gap.severity === "warning"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {gap.item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 flex justify-center">
          <Link href="/readiness">
            <Button className="gap-2">
              <Target className="h-4 w-4" />
              Improve Readiness
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
