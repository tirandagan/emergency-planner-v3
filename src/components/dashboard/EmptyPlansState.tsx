"use client";

import { FileText, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyPlansStateProps {
  onCreatePlan: () => void;
}

export function EmptyPlansState({ onCreatePlan }: EmptyPlansStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-10 w-10 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Emergency Plans Yet
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Create your first emergency plan to assess your preparedness and get
        personalized recommendations for your family&apos;s safety.
      </p>

      {/* CTA */}
      <Button onClick={onCreatePlan} size="lg" className="gap-2">
        <Plus className="h-5 w-5" />
        Create Your First Plan
      </Button>

      {/* Features */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center max-w-2xl">
        <div className="p-4">
          <p className="text-sm font-medium text-foreground">
            Personalized Plans
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tailored to your location and family needs
          </p>
        </div>
        <div className="p-4">
          <p className="text-sm font-medium text-foreground">
            Multiple Scenarios
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Prepare for various emergency situations
          </p>
        </div>
        <div className="p-4">
          <p className="text-sm font-medium text-foreground">
            Readiness Scoring
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Track your preparedness progress
          </p>
        </div>
      </div>
    </div>
  );
}
