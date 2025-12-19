"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Users, Calendar, Shield } from "lucide-react";

interface UpgradeBannerProps {
  planCount: number;
}

export function UpgradeBanner({ planCount }: UpgradeBannerProps) {
  return (
    <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">
                Unlock Unlimited Emergency Planning
              </h3>
            </div>
            <p className="text-muted-foreground mb-4">
              {planCount === 0
                ? "Create unlimited plans and share them with your family."
                : "You've created your first plan! Upgrade to create unlimited plans and access premium features."}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Unlimited plans</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Share with family</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Priority support</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/pricing">View All Plans</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/profile?tab=subscription">Upgrade Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
