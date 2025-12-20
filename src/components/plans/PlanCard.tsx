'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileText, MapPin, Users, Calendar, Clock, Trash2, Eye } from 'lucide-react';
import { deleteMissionReport } from '@/app/actions/plans';
import { toast } from 'sonner';
import type { MissionReport } from '@/lib/mission-reports';

interface PlanCardProps {
  plan: MissionReport;
}

export function PlanCard({ plan }: PlanCardProps): React.JSX.Element {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const scenarioLabels: Record<string, string> = {
    earthquake: 'Earthquake',
    hurricane: 'Hurricane',
    wildfire: 'Wildfire',
    flood: 'Flood',
    'winter-storm': 'Winter Storm',
    tornado: 'Tornado',
    'power-outage': 'Power Outage',
    pandemic: 'Pandemic',
  };

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      const result = await deleteMissionReport(plan.id);
      if (result.success) {
        toast.success('Plan moved to trash');
        setShowDeleteDialog(false);
      } else {
        toast.error(result.error || 'Failed to delete plan');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-xl line-clamp-2">{plan.title}</CardTitle>
              {plan.location && (
                <CardDescription className="mt-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {plan.location}
                </CardDescription>
              )}
            </div>
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4">
          {/* Scenarios */}
          {plan.scenarios.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Scenarios:</p>
              <div className="flex flex-wrap gap-2">
                {plan.scenarios.map((scenario) => (
                  <Badge key={scenario} variant="secondary" className="text-xs">
                    {scenarioLabels[scenario] || scenario}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Plan Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{plan.familySize} {plan.familySize === 1 ? 'person' : 'people'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{plan.durationDays} days preparation</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created {formatDate(plan.createdAt)}</span>
            </div>
          </div>

          {/* Readiness Score */}
          {plan.readinessScore !== null && (
            <div>
              <p className="text-sm font-medium mb-1">Readiness Score:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${plan.readinessScore}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{plan.readinessScore}%</span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 pt-4 border-t">
          <Button asChild className="flex-1" variant="default">
            <Link href={`/plans/${plan.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Plan
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This plan will be moved to trash. You can restore it within 30 days from the trash page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Move to Trash'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
