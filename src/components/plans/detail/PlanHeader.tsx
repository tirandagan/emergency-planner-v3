'use client';

import { useState } from 'react';
import { ArrowLeft, FileDown, Share2, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SharePlanModal } from '@/components/plans/modals/SharePlanModal';
import { EditPlanModal } from '@/components/plans/modals/EditPlanModal';
import { DeletePlanModal } from '@/components/plans/modals/DeletePlanModal';
import type { MissionReport } from '@/lib/mission-reports';

interface PlanHeaderProps {
  report: MissionReport;
  userTier?: 'FREE' | 'BASIC' | 'PRO';
  currentShareCount?: number;
  userName?: string;
}

export function PlanHeader({ report, userTier = 'FREE', currentShareCount = 0, userName = 'User' }: PlanHeaderProps) {
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleBack = (): void => {
    router.push('/dashboard');
  };

  const handlePrint = (): void => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Compact Header - Single Row on Desktop */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left Section: Back Button + Title + Metadata */}
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {/* Back Button - Icon Only on Mobile, Full on Desktop */}
          <Button
            variant="ghost"
            onClick={handleBack}
            size="sm"
            className="shrink-0 -ml-2"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="!h-4 !w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          {/* Title and Metadata */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
              {report.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generated {new Date(report.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Right Section: Action Buttons */}
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            aria-label="Export plan"
          >
            <FileDown className="!h-4 !w-4" />
            <span className="hidden md:inline">Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareModal(true)}
            aria-label="Share plan"
          >
            <Share2 className="!h-4 !w-4" />
            <span className="hidden md:inline">Share</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditModal(true)}
            aria-label="Edit plan"
          >
            <Edit className="!h-4 !w-4" />
            <span className="hidden md:inline">Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            aria-label="Delete plan"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="!h-4 !w-4" />
            <span className="hidden md:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Modals */}
      <SharePlanModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        reportId={report.id}
        reportTitle={report.title}
        userTier={userTier}
        currentShareCount={currentShareCount}
        senderName={userName}
      />
      <EditPlanModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        reportId={report.id}
        reportTitle={report.title}
      />
      <DeletePlanModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        reportId={report.id}
        reportTitle={report.title}
        createdAt={new Date(report.createdAt)}
      />
    </div>
  );
}
