"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  Users,
  Calendar,
  ArrowRight,
  AlertTriangle,
  Home,
  Package,
  Pencil,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { CircularGauge } from "@/components/ui/CircularGauge";
import { useExpandable } from "@/components/hooks/use-expandable";
import type { MissionReport } from "@/lib/mission-reports";
import Link from "next/link";

interface EmergencyPlanCardProps {
  plan: MissionReport;
  onEdit?: (plan: MissionReport) => void;
}

export function EmergencyPlanCard({
  plan,
  onEdit,
}: EmergencyPlanCardProps): React.ReactElement {
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      animatedHeight.set(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded, animatedHeight]);

  const readinessScore = plan.readinessScore ?? 0;
  const scenarios = plan.scenarios || [];

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleEditClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(plan);
    }
  };

  const getReadinessColor = (score: number): string => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getReadinessLabel = (score: number): string => {
    if (score >= 70) return "Ready";
    if (score >= 40) return "In Progress";
    return "Needs Attention";
  };

  return (
    <Card
      className="w-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/40 group"
      onClick={toggleExpand}
    >
      <CardHeader className="space-y-3">
        <Badge
          variant="secondary"
          className={
            readinessScore >= 70
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 w-fit"
              : readinessScore >= 40
              ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 w-fit"
              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 w-fit"
          }
        >
          {getReadinessLabel(readinessScore)}
        </Badge>
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-semibold flex-1" title={plan.title}>
            {plan.title}
          </h3>
          {onEdit && (
            <button
              onClick={handleEditClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted rounded flex-shrink-0"
              aria-label="Edit plan title"
            >
              <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Readiness Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Readiness Score</span>
              <span className={getReadinessColor(readinessScore)}>
                {readinessScore}%
              </span>
            </div>
            <ProgressBar value={readinessScore} className="h-2" />
          </div>

          {/* Expandable Content */}
          <motion.div
            style={{ height: animatedHeight }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div ref={contentRef}>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 pt-2"
                  >
                    {/* Location and Date Info */}
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{plan.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(plan.updatedAt || plan.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Emergency Scenarios */}
                    {scenarios.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                          Emergency Scenarios
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {scenarios.map((scenario, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-primary/10 text-primary border-0"
                            >
                              {scenario}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Plan Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Family Size
                          </span>
                        </div>
                        <p className="text-sm font-medium pl-6">
                          {plan.familySize} people
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Duration
                          </span>
                        </div>
                        <p className="text-sm font-medium pl-6">
                          {plan.durationDays} days
                        </p>
                      </div>
                      {plan.mobilityType && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Mobility
                            </span>
                          </div>
                          <p className="text-sm font-medium pl-6">
                            {plan.mobilityType}
                          </p>
                        </div>
                      )}
                      {plan.budgetAmount && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Budget
                            </span>
                          </div>
                          <p className="text-sm font-medium pl-6">
                            ${plan.budgetAmount}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* View Full Plan Button */}
                    <div className="pt-2">
                      <Link href={`/plans/${plan.id}`}>
                        <Button className="w-full" variant="default">
                          View Full Plan
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex items-center justify-between w-full">
          {/* Readiness Score with Circular Gauge */}
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
              <p className={`text-sm font-bold ${getReadinessColor(readinessScore)}`}>
                {readinessScore}%
              </p>
            </div>
          </div>

          {/* Last Updated */}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Updated {formatDate(plan.updatedAt || plan.createdAt)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
