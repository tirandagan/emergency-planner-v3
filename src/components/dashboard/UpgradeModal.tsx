"use client";

import { Crown, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingPlanTitle?: string;
  onOverwrite: () => void;
  isLoading?: boolean;
}

export function UpgradeModal({
  open,
  onOpenChange,
  existingPlanTitle,
  onOverwrite,
  isLoading = false,
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Plan Limit Reached</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Free accounts can save 1 emergency plan. Upgrade for unlimited plans
            or overwrite your existing plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upgrade Option */}
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">
                  Upgrade to Basic
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Get unlimited plans, plan sharing, and more features
                </p>
                <div className="mt-3">
                  <Link href="/pricing">
                    <Button className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      View Plans
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          {/* Overwrite Option */}
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-muted">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">
                  Overwrite Existing Plan
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {existingPlanTitle ? (
                    <>
                      Your current plan &ldquo;{existingPlanTitle}&rdquo; will
                      be replaced
                    </>
                  ) : (
                    "Your current plan will be permanently replaced"
                  )}
                </p>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    onClick={onOverwrite}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Overwrite Plan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
