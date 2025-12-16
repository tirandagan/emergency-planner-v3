'use client';

import { BookOpen, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import type { SkillItem, SkillPriority } from '@/types/mission-report';
import { cn } from '@/lib/utils';

interface SkillsTabProps {
  skills: SkillItem[];
}

const priorityConfig: Record<SkillPriority, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof AlertCircle;
}> = {
  critical: {
    label: 'Critical',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    icon: AlertCircle,
  },
  important: {
    label: 'Important',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    icon: CheckCircle2,
  },
  helpful: {
    label: 'Helpful',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    icon: Circle,
  },
};

export function SkillsTab({ skills }: SkillsTabProps) {
  if (skills.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
        <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Skills Identified
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Survival skills needed for your scenarios will appear here.
        </p>
      </div>
    );
  }

  const criticalSkills = skills.filter(s => s.priority === 'critical');
  const importantSkills = skills.filter(s => s.priority === 'important');
  const helpfulSkills = skills.filter(s => s.priority === 'helpful');

  return (
    <div className="space-y-8">
      {/* Skills Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Skills Overview
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {skills.length} survival skills identified for your scenarios. Focus on critical skills first.
        </p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium">
              {criticalSkills.length} Critical
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-medium">
              {importantSkills.length} Important
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium">
              {helpfulSkills.length} Helpful
            </span>
          </div>
        </div>
      </div>

      {/* Resource Matching Coming Soon */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <BookOpen className="h-4 w-4" />
          <span>
            <strong>Coming Soon:</strong> Video tutorials, articles, and PDFs matched to each skill.
          </span>
        </div>
      </div>

      {/* Critical Skills */}
      {criticalSkills.length > 0 && (
        <SkillSection
          title="Critical Skills"
          subtitle="Master these first - they're essential for survival"
          skills={criticalSkills}
          priority="critical"
        />
      )}

      {/* Important Skills */}
      {importantSkills.length > 0 && (
        <SkillSection
          title="Important Skills"
          subtitle="Build these skills to improve your preparedness"
          skills={importantSkills}
          priority="important"
        />
      )}

      {/* Helpful Skills */}
      {helpfulSkills.length > 0 && (
        <SkillSection
          title="Helpful Skills"
          subtitle="Nice to have for enhanced capability"
          skills={helpfulSkills}
          priority="helpful"
        />
      )}
    </div>
  );
}

function SkillSection({
  title,
  subtitle,
  skills,
  priority,
}: {
  title: string;
  subtitle: string;
  skills: SkillItem[];
  priority: SkillPriority;
}) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {skills.map((skill, index) => (
          <div
            key={index}
            className={cn(
              'rounded-lg border p-4',
              config.bgColor
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', config.color)} />
              <div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100">
                  {skill.skill}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {skill.reason}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
