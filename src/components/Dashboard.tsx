"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getSavedScenarios,
  deleteScenario,
  updateMissionReportTitle,
} from "@/app/actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SubscriptionTier } from "@/lib/types/subscription";
import { hasReachedPlanLimit } from "@/lib/types/subscription";
import type { MissionReport } from "@/lib/mission-reports";

// Raw scenario data from getSavedScenarios
interface RawScenario {
  id: string;
  user_id: string;
  title?: string;
  location: string;
  scenarios?: string[];
  family_size?: number;
  duration_days?: number;
  mobility_type?: string;
  budget_amount?: string;
  report_data?: {
    readinessScore?: number;
    [key: string]: unknown;
  };
  readiness_score?: number;
  scenario_scores?: unknown;
  component_scores?: unknown;
  created_at: string;
  updated_at?: string;
}

// Dashboard components
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { ReadinessSummary } from "./dashboard/ReadinessSummary";
import { PlanGrid } from "./dashboard/PlanGrid";
import { EditTitleModal } from "./dashboard/EditTitleModal";
import { UpgradeModal } from "./dashboard/UpgradeModal";

interface DashboardProps {
  userTier: SubscriptionTier;
  userName: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ userTier, userName }) => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [dataLoading, setDataLoading] = useState(true);
  const [plans, setPlans] = useState<MissionReport[]>([]);

  // Modal states
  const [editingPlan, setEditingPlan] = useState<MissionReport | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isOverwriting, setIsOverwriting] = useState(false);

  // Fetch plans
  useEffect(() => {
    let isMounted = true;

    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (authLoading || !user) {
      return;
    }

    const fetchPlans = async () => {
      try {
        const scenarios = await getSavedScenarios(user.id);
        if (isMounted) {
          // Transform to MissionReport type
          const transformedPlans: MissionReport[] = ((scenarios || []) as unknown as RawScenario[]).map(
            (s) => ({
              id: s.id,
              userId: s.user_id,
              title: s.title || `Plan - ${s.location}`,
              location: s.location,
              scenarios: s.scenarios || [],
              familySize: s.family_size || 4,
              durationDays: s.duration_days || 7,
              mobilityType: s.mobility_type ?? null,
              budgetAmount: s.budget_amount ?? null,
              reportData: s.report_data as MissionReport['reportData'],
              readinessScore: s.report_data?.readinessScore || s.readiness_score || 0,
              scenarioScores: s.scenario_scores,
              componentScores: s.component_scores,
              createdAt: new Date(s.created_at),
              updatedAt: new Date(s.updated_at || s.created_at),
            })
          );
          setPlans(transformedPlans);
        }
      } catch (e) {
        console.error("Failed to load plans", e);
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
      }
    };

    fetchPlans();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, router]);

  // Handle create new plan
  const handleCreatePlan = useCallback(() => {
    const atLimit = hasReachedPlanLimit(userTier, plans.length);

    if (atLimit) {
      setShowUpgradeModal(true);
    } else {
      router.push("/plans/new");
    }
  }, [userTier, plans.length, router]);

  // Handle overwrite existing plan
  const handleOverwrite = useCallback(async () => {
    if (plans.length === 0) return;

    setIsOverwriting(true);
    try {
      // Delete the existing plan
      if (user) {
        await deleteScenario(plans[0].id, user.id);
        setPlans([]);
      }
      setShowUpgradeModal(false);
      // Navigate to wizard
      router.push("/plans/new");
    } catch (err) {
      console.error("Failed to overwrite plan", err);
    } finally {
      setIsOverwriting(false);
    }
  }, [plans, user, router]);

  // Handle edit plan title
  const handleEditPlan = useCallback((plan: MissionReport) => {
    setEditingPlan(plan);
  }, []);

  // Handle save title
  const handleSaveTitle = useCallback(
    async (planId: string, newTitle: string) => {
      if (!user) return;

      await updateMissionReportTitle(planId, user.id, newTitle);

      // Update local state
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? { ...p, title: newTitle, updatedAt: new Date() }
            : p
        )
      );
    },
    [user]
  );

  // Handle delete plan
  const handleDeletePlan = useCallback(
    async (planId: string) => {
      if (!user) return;

      try {
        await deleteScenario(planId, user.id);
        setPlans((prev) => prev.filter((p) => p.id !== planId));
      } catch (err) {
        console.error("Failed to delete plan", err);
      }
    },
    [user]
  );

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Welcome + CTA */}
      <DashboardHeader
        userName={userName}
        userTier={userTier}
        planCount={plans.length}
        onCreatePlan={handleCreatePlan}
      />

      {/* Readiness Summary Widget (Placeholder for Phase 6) */}
      <ReadinessSummary isPlaceholder={true} />

      {/* Plan Grid */}
      <PlanGrid
        plans={plans}
        onEditPlan={handleEditPlan}
        onDeletePlan={handleDeletePlan}
        onCreatePlan={handleCreatePlan}
      />

      {/* Edit Title Modal */}
      {editingPlan && (
        <EditTitleModal
          open={!!editingPlan}
          onOpenChange={(open) => !open && setEditingPlan(null)}
          currentTitle={editingPlan.title}
          planId={editingPlan.id}
          onSave={handleSaveTitle}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        existingPlanTitle={plans[0]?.title}
        onOverwrite={handleOverwrite}
        isLoading={isOverwriting}
      />
    </div>
  );
};

export default Dashboard;
