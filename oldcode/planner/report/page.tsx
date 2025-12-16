"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MissionReport from '@/components/MissionReport';
import { SaveReportModal } from '@/components/SaveReportModal';
import { GeneratedKit } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { saveMissionReport, getMissionReport, enrichSurvivalPlanWithResources } from '@/app/actions';
import { Loader2, AlertTriangle } from 'lucide-react';

// Storage key for temporary report data
const REPORT_STORAGE_KEY = 'prepperai_temp_report';

interface StoredReportData {
  result: GeneratedKit;
  location: string;
  duration: number;
  familySize: number;
  scenarios: string[];
  mobility: string;
  budgetAmount: number;
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [reportData, setReportData] = useState<StoredReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Save Modal State
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [defaultTitle, setDefaultTitle] = useState('');

  // Check for saved report ID in URL
  const reportId = searchParams.get('id');

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError(null);

      try {
        // If we have a report ID, fetch from database
        if (reportId && user) {
          const saved = await getMissionReport(reportId, user.id);
          if (saved) {
            setReportData({
              result: saved.report_data,
              location: saved.location,
              duration: saved.duration_days,
              familySize: saved.family_size,
              scenarios: saved.scenarios,
              mobility: saved.mobility_type,
              budgetAmount: saved.budget_amount,
            });
            setSavedId(reportId);
          } else {
            setError('Report not found or you do not have access');
          }
        } else if (reportId && !user) {
          // User needs to be logged in to view saved reports
          setError('Please sign in to view saved reports');
        } else {
          // Otherwise, try to load from localStorage
          const stored = localStorage.getItem(REPORT_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as StoredReportData;
            setReportData(parsed);
          } else {
            setError('No report data found. Please generate a new report.');
          }
        }
      } catch (err) {
        console.error('Failed to load report:', err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportId, user]);

  const handleSave = async () => {
    if (!reportData || !user) return;
    
    // Pre-populate the title based on geography and scenarios
    const scenariosList = reportData.scenarios ? reportData.scenarios.join(' + ') : 'Survival';
    // Format title as "Scenarios - Location" or similar
    const suggestedTitle = `${scenariosList} - ${reportData.location}`;
    
    setDefaultTitle(suggestedTitle);
    setSaveModalOpen(true);
  };

  const executeSave = async (title: string) => {
    if (!reportData || !user) return;
    
    setSaveModalOpen(false);
    setSaving(true);
    try {
      // Ensure all skill resources are loaded before saving
      let resultToSave = reportData.result;
      const requiredSkillsCount = resultToSave.requiredSkills?.length || 0;
      // Check if we have resources for all skills
      const hasAllResources = resultToSave.skillResources && resultToSave.skillResources.length === requiredSkillsCount;
      
      if (requiredSkillsCount > 0 && !hasAllResources) {
          try {
            // Fetch missing resources (this enriches the plan with videos, articles, pdfs)
            resultToSave = await enrichSurvivalPlanWithResources(resultToSave);
            
            // Update local state with enriched data
            setReportData(prev => prev ? ({ ...prev, result: resultToSave }) : null);
          } catch (enrichError) {
             console.error("Failed to enrich resources before save", enrichError);
             // We proceed to save even if enrichment fails, to at least save the core plan
          }
      }

      const saved = await saveMissionReport(user.id, {
        title: title,
        location: reportData.location,
        scenarios: reportData.result.scenarios || reportData.scenarios,
        familySize: reportData.familySize,
        durationDays: reportData.duration,
        mobilityType: reportData.mobility,
        budgetAmount: reportData.budgetAmount,
        reportData: resultToSave
      });
      setSavedId(saved.id);
      
      // Clear temp storage after successful save
      localStorage.removeItem(REPORT_STORAGE_KEY);
      
      // Update URL to include the saved report ID
      router.replace(`/planner/report?id=${saved.id}`);
    } catch (err) {
      console.error("Failed to save", err);
      alert("Failed to save mission report. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleNewSimulation = () => {
    // Clear stored report data
    localStorage.removeItem(REPORT_STORAGE_KEY);
    router.push('/planner');
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 text-tactical-accent animate-spin" />
        <p className="text-gray-400 mt-4 font-mono">Loading mission report...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Report Not Available</h2>
          <p className="text-gray-400 mb-6">{error || 'No report data found.'}</p>
          <button
            onClick={() => router.push('/planner')}
            className="bg-tactical-accent text-black px-6 py-3 rounded font-bold hover:bg-yellow-400 transition-colors"
          >
            CREATE NEW REPORT
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <MissionReport
        result={reportData.result}
        location={reportData.location}
        duration={reportData.duration}
        familySize={reportData.familySize}
        onSave={handleSave}
        onNewSimulation={handleNewSimulation}
        isSaved={!!savedId}
        isSaving={saving}
        isLoggedIn={!!user}
      />
      
      <SaveReportModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={executeSave}
        initialTitle={defaultTitle}
      />
    </>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 text-tactical-accent animate-spin" />
        <p className="text-gray-400 mt-4 font-mono">Loading...</p>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
