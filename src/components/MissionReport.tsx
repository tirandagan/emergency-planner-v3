"use client";

import React, { useState, useMemo } from 'react';
import { GeneratedKit, ItemType, SupplyItem } from '@/types';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Loader2, CheckCircle2, ExternalLink,
  BrainCircuit, Droplets, BookOpen, Clock,
  Car, Footprints, MapPin,
  Save, X, LogIn, Home,
  ChevronDown, ChevronUp, Route, Package, Info, Target, Users,
  Map as MapIcon, FileText, DollarSign
} from 'lucide-react';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });
const CriticalSkills = dynamic(() => import('./CriticalSkills'), { ssr: false });

export interface MissionReportProps {
  result: GeneratedKit;
  location: string;
  duration: number;
  familySize: number;
  onSave?: () => Promise<void>;
  onNewSimulation?: () => void;
  isSaved?: boolean;
  isSaving?: boolean;
  isLoggedIn?: boolean;
  onSignInPrompt?: () => void;
}

const MissionReport: React.FC<MissionReportProps> = ({
  result,
  location,
  duration,
  familySize,
  onSave,
  onNewSimulation,
  isSaved = false,
  isSaving = false,
  isLoggedIn = false,
  onSignInPrompt,
}) => {
  const router = useRouter();

  // Report view state - Overview is now the first tab
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'gear' | 'intel' | 'skills'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'simlog', 'rations']));
  const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(new Set());
  const [gearFilter, setGearFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'needed'>('all');
  const [items, setItems] = useState(result.items || []);

  // Helper to normalize dangerLevel in case AI returns verbose text
  const normalizeDangerLevel = (level: string | undefined): 'High' | 'Medium' | 'Low' => {
    if (!level) return 'Medium';
    const upper = level.toUpperCase();
    if (upper.includes('HIGH') || upper.includes('CRITICAL') || upper.includes('SEVERE')) return 'High';
    if (upper.includes('LOW') || upper.includes('MINIMAL') || upper.includes('SAFE')) return 'Low';
    return 'Medium';
  };

  // Sign-in prompt dialog
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const toggleRoute = (idx: number) => {
    setExpandedRoutes(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleOwned = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, owned: !item.owned } : item
    ));
  };

  const getSearchUrl = (itemName: string) => {
    return `https://www.amazon.com/s?k=${encodeURIComponent(itemName + ' survival gear')}&tag=prepperai-20`;
  };

  const handleSave = async () => {
    if (!isLoggedIn) {
      setShowSignInPrompt(true);
      return;
    }
    if (onSave) {
      await onSave();
    }
  };

  // Computed values for gear filtering
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (gearFilter === 'all') return true;
      if (gearFilter === 'needed') return !item.owned;
      return item.priority?.toLowerCase() === gearFilter;
    });
  }, [items, gearFilter]);

  const gearStats = useMemo(() => {
    const owned = items.filter(i => i.owned).length;
    const totalCost = items.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
    const ownedCost = items.filter(i => i.owned).reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
    const neededCost = items.filter(i => !i.owned).reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
    return { total: items.length, owned, totalCost, ownedCost, neededCost };
  }, [items]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Sign-in Prompt Dialog */}
      {showSignInPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-tactical-accent/20 flex items-center justify-center">
                  <Save className="w-6 h-6 text-tactical-accent" />
                </div>
                <h3 className="text-xl font-bold text-white">Save Your Report</h3>
              </div>
              <button
                onClick={() => setShowSignInPrompt(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-300 mb-6">
              Your mission report has been generated! Sign in to save it permanently and access it anytime from your dashboard.
            </p>

            <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-700">
              <h4 className="text-sm font-bold text-tactical-accent uppercase mb-2">What you'll save:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Complete survival plan & gear list</li>
                <li>• Evacuation routes & maps</li>
                <li>• Skills training resources</li>
                <li>• Ration calculations</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSignInPrompt(false);
                  router.push('/login?redirect=/planner/report');
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-tactical-accent text-black px-4 py-3 rounded font-bold hover:bg-yellow-400 transition-colors"
              >
                <LogIn className="w-4 h-4" /> SIGN IN
              </button>
              <button
                onClick={() => setShowSignInPrompt(false)}
                className="flex-1 text-gray-400 hover:text-white border border-gray-700 px-4 py-3 rounded font-medium hover:bg-gray-700 transition-colors"
              >
                MAYBE LATER
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Don&apos;t have an account? <a href="/auth/login?redirect=/planner/report" className="text-tactical-accent hover:underline">Create one for free</a>
            </p>
          </div>
        </div>
      )}

      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-tactical-accent" />
            <div>
              <h1 className="text-xl font-bold text-white font-mono">MISSION REPORT</h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {(result.scenarios || []).map((s, i) => (
                  <span key={i} className="bg-red-900/30 text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Readiness Score Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${result.readinessScore > 80 ? 'bg-green-900/20 border-green-700 text-green-400' :
            result.readinessScore > 50 ? 'bg-yellow-900/20 border-yellow-700 text-yellow-400' :
              'bg-red-900/20 border-red-700 text-red-400'
            }`}>
            <Target className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">{result.readinessScore || '0'}</span>
          </div>
          {isSaved ? (
            <span className="flex items-center gap-2 text-green-400 text-xs font-medium px-3 py-1.5 bg-green-900/20 border border-green-700 rounded">
              <CheckCircle2 className="w-3 h-3" /> SAVED
            </span>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 text-xs bg-tactical-accent text-black px-3 py-1.5 rounded font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {isSaving ? 'SAVING...' : 'SAVE'}
            </button>
          )}
          {onNewSimulation && (
            <button
              onClick={onNewSimulation}
              className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded hover:bg-gray-800 transition-colors"
            >
              NEW
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${activeTab === 'overview'
            ? 'border-tactical-accent text-tactical-accent'
            : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
        >
          <FileText className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${activeTab === 'map'
            ? 'border-tactical-accent text-tactical-accent'
            : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
        >
          <Route className="w-4 h-4" />
          <span>Map & Routes</span>
          {result.evacuationRoutes && result.evacuationRoutes.length > 0 && (
            <span className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">{result.evacuationRoutes.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('gear')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${activeTab === 'gear'
            ? 'border-tactical-accent text-tactical-accent'
            : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
        >
          <Package className="w-4 h-4" />
          <span>Gear</span>
          <span className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">{gearStats.owned}/{gearStats.total}</span>
        </button>
        <button
          onClick={() => setActiveTab('intel')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${activeTab === 'intel'
            ? 'border-tactical-accent text-tactical-accent'
            : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Intel</span>
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${activeTab === 'skills'
            ? 'border-tactical-accent text-tactical-accent'
            : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Critical Skills</span>
          {(result.requiredSkills || []).length > 0 && (
            <span className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">{(result.requiredSkills || []).length}</span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Mission Parameters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2">
                  <MapPin className="w-3 h-3 text-tactical-accent" />
                  Location
                </div>
                <div className="text-white font-medium">{location}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2">
                  <Clock className="w-3 h-3 text-tactical-accent" />
                  Duration
                </div>
                <div className="text-white font-medium">{duration} Days</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2">
                  <Clock className="w-3 h-3 text-tactical-accent" />
                  Prep Time
                </div>
                <div className="text-white font-medium text-xs">{result.preparationTime || 'N/A'}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2">
                  <Users className="w-3 h-3 text-tactical-accent" />
                  Personnel
                </div>
                <div className="text-white font-medium">{familySize} PAX</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-tactical-accent">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2">
                  <Target className="w-3 h-3 text-tactical-accent" />
                  Readiness Score
                </div>
                <div className={`text-2xl font-bold font-mono ${result.readinessScore > 80 ? 'text-green-500' :
                  result.readinessScore > 50 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                  {result.readinessScore || '0'}/100
                </div>
              </div>
            </div>

            {/* Strategic Overview */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-tactical-accent" />
                <h3 className="text-sm font-bold text-tactical-accent uppercase tracking-wider">Strategic Overview</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('map')}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Route className="w-6 h-6 text-tactical-accent" />
                    <div>
                      <div className="font-bold text-white text-sm">Evacuation Routes</div>
                      <div className="text-xs text-gray-500">{result.evacuationRoutes?.length || 0} routes available</div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90 group-hover:text-tactical-accent transition-colors" />
                </div>
              </button>
              <button
                onClick={() => setActiveTab('gear')}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6 text-tactical-accent" />
                    <div>
                      <div className="font-bold text-white text-sm">Gear Checklist</div>
                      <div className="text-xs text-gray-500">{gearStats.owned}/{gearStats.total} items ready</div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90 group-hover:text-tactical-accent transition-colors" />
                </div>
              </button>
              <button
                onClick={() => setActiveTab('intel')}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="w-6 h-6 text-tactical-accent" />
                    <div>
                      <div className="font-bold text-white text-sm">Intel & Skills</div>
                      <div className="text-xs text-gray-500">{(result.requiredSkills || []).length} skills to learn</div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90 group-hover:text-tactical-accent transition-colors" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Map & Routes Tab */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            {result.evacuationRoutes && result.evacuationRoutes.length > 0 ? (
              <>
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                  <MapComponent 
                    routes={result.evacuationRoutes} 
                    activeRouteIndices={Array.from(expandedRoutes)}
                  />
                </div>

                {/* Collapsible Route Cards */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-tactical-accent" />
                    Route Options ({result.evacuationRoutes.length})
                  </h3>
                  {result.evacuationRoutes.map((route, idx) => (
                    <div 
                      key={route.id || idx} 
                      className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                        expandedRoutes.has(idx) 
                          ? 'bg-gray-800 border-tactical-accent ring-1 ring-tactical-accent/50 shadow-lg shadow-tactical-accent/10' 
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <button
                        onClick={() => toggleRoute(idx)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-tactical-accent/20 flex items-center justify-center text-tactical-accent font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{route.name}</h4>
                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                              <span className="flex items-center gap-1">
                                {route.type === 'vehicle' ? <Car className="w-3 h-3" /> : <Footprints className="w-3 h-3" />}
                                {route.type === 'vehicle' ? 'Vehicle' : 'On Foot'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {(() => {
                            const normalizedLevel = normalizeDangerLevel(route.dangerLevel);
                            return (
                              <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${normalizedLevel === 'High' ? 'bg-red-900/50 text-red-200 border border-red-700' :
                                normalizedLevel === 'Medium' ? 'bg-yellow-900/50 text-yellow-200 border border-yellow-700' :
                                  'bg-green-900/50 text-green-200 border border-green-700'
                                }`}>
                                {normalizedLevel} Risk
                              </span>
                            );
                          })()}
                          {expandedRoutes.has(idx) ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </div>
                      </button>
                      {expandedRoutes.has(idx) && (
                        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                          <div className="pt-3 border-t border-gray-700 space-y-3">
                            <p className="text-sm text-gray-300 leading-relaxed">{route.description}</p>
                            {route.riskAssessment && (
                              <div className={`text-xs p-2 rounded border ${normalizeDangerLevel(route.dangerLevel) === 'High' ? 'bg-red-950/30 border-red-800/50 text-red-300' :
                                normalizeDangerLevel(route.dangerLevel) === 'Medium' ? 'bg-yellow-950/30 border-yellow-800/50 text-yellow-300' :
                                  'bg-green-950/30 border-green-800/50 text-green-300'
                                }`}>
                                <span className="font-semibold uppercase tracking-wide">Risk Assessment:</span> {route.riskAssessment}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 text-center">
                <Home className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Bug-in scenario selected. No evacuation routes generated.</p>
              </div>
            )}
          </div>
        )}

        {/* Gear Tab */}
        {activeTab === 'gear' && (
          <div className="space-y-4">
            {/* Gear Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="text-[10px] text-gray-500 font-mono uppercase">Items Ready</div>
                <div className="text-lg text-white font-bold font-mono">{gearStats.owned}/{gearStats.total}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="text-[10px] text-gray-500 font-mono uppercase">Items Needed</div>
                <div className="text-lg text-yellow-400 font-bold font-mono">{gearStats.total - gearStats.owned}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="text-[10px] text-gray-500 font-mono uppercase flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Total List Cost
                </div>
                <div className="text-lg text-white font-bold font-mono">${gearStats.totalCost.toLocaleString()}</div>
              </div>
              <div className="bg-tactical-accent/10 rounded-lg p-3 border border-tactical-accent/30">
                <div className="text-[10px] text-tactical-accent font-mono uppercase flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Still Needed
                </div>
                <div className="text-lg text-tactical-accent font-bold font-mono">${gearStats.neededCost.toLocaleString()}</div>
              </div>
            </div>

            {/* Gear Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <span className="text-xs text-gray-500 font-mono uppercase">Filter:</span>
              {[
                { key: 'all', label: 'All' },
                { key: 'needed', label: 'Needed', color: 'text-yellow-400' },
                { key: 'high', label: 'High Priority', color: 'text-red-400' },
                { key: 'medium', label: 'Medium', color: 'text-yellow-400' },
                { key: 'low', label: 'Low', color: 'text-blue-400' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setGearFilter(f.key as typeof gearFilter)}
                  className={`text-xs px-2.5 py-1 rounded font-bold uppercase transition-colors ${gearFilter === f.key
                    ? 'bg-tactical-accent text-black'
                    : `bg-gray-700/50 ${f.color || 'text-gray-400'} hover:bg-gray-700`
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Gear Items - Compact List */}
            <div className="space-y-2">
              {filteredItems.length === 0 ? (
                <div className="bg-gray-800/50 rounded-lg p-8 text-center border border-gray-700">
                  <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-3" />
                  <p className="text-gray-400">
                    {gearFilter === 'needed' ? 'All items acquired!' : 'No items match this filter.'}
                  </p>
                </div>
              ) : (
                filteredItems.map((item, index) => {
                    const supply: SupplyItem | undefined = (item.supplyIndex !== undefined && result.supplies) ? result.supplies[item.supplyIndex] : undefined;
                    // Note: supply.matched_products is the new array, matched_product is legacy single
                    const products = supply?.matched_products || (supply?.matched_product ? [supply.matched_product] : []);
                    
                    return (
                  <div
                    key={item.id || index}
                    className={`bg-gray-800 border rounded-lg p-4 flex flex-col gap-3 transition-all hover:border-gray-600 ${item.owned ? 'border-green-900/50 bg-green-900/5' : 'border-gray-700'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                        <button
                        onClick={() => toggleOwned(item.id)}
                        className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors mt-1 ${item.owned
                            ? 'bg-green-500 border-green-500 text-black'
                            : 'border-gray-600 hover:border-gray-400'
                            }`}
                        >
                        {item.owned && <CheckCircle2 className="w-3 h-3" />}
                        </button>

                        <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${item.priority === 'High' ? 'bg-red-900/50 text-red-400' :
                            item.priority === 'Medium' ? 'bg-yellow-900/50 text-yellow-400' :
                                'bg-blue-900/50 text-blue-400'
                            }`}>
                            {item.priority}
                            </span>
                            <h4 className={`text-base font-bold truncate ${item.owned ? 'text-gray-500 line-through' : 'text-white'}`}>
                            {supply?.item_name || item.name} {/* Show Generic Name as Title */}
                            </h4>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{supply?.search_query || item.description}</p>
                        
                        {supply && (
                            <div className="text-xs text-gray-500 mt-2">
                                Need: <span className="text-tactical-accent font-mono">{supply.quantity_needed.toLocaleString()} {supply.unit_type}</span>
                            </div>
                        )}
                        </div>
                    </div>

                    {/* Specific Products List */}
                    {products.length > 0 && (
                        <div className="mt-2 ml-8 space-y-2 border-t border-gray-700/50 pt-3">
                            {products.map((prod, pIdx) => {
                                const capacity = prod.capacity_value || 1;
                                const qtyToBuy = Math.ceil((supply?.quantity_needed || 0) / capacity);
                                
                                return (
                                    <div key={prod.id || pIdx} className="flex items-center gap-3 bg-gray-900/30 p-2 rounded border border-gray-700/50">
                                        {prod.image_url && (
                                            <img src={prod.image_url} alt={prod.name} className="w-10 h-10 object-cover rounded bg-gray-800 shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-200 truncate">{prod.name}</div>
                                            <div className="text-[10px] text-gray-500 flex items-center gap-2">
                                                <span>Yield: {prod.capacity_value} {prod.capacity_unit}</span>
                                                <span className="text-gray-600">•</span>
                                                <span>Buy: <span className="text-white font-bold">{qtyToBuy}</span></span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-mono text-sm text-tactical-accent">${(prod.price || 0).toLocaleString()}</div>
                                            {prod.affiliate_link ? (
                                                <a 
                                                    href={prod.affiliate_link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded mt-1 transition-colors"
                                                >
                                                    BUY <ExternalLink className="w-2 h-2" />
                                                </a>
                                            ) : (
                                                <span className="text-[10px] text-gray-500">No Link</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {products.length === 0 && (
                        <div className="ml-8 mt-1">
                             <a
                                href={item.link || getSearchUrl(supply?.item_name || item.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-500 hover:text-gray-300 underline flex items-center gap-1"
                            >
                                Find on Amazon <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}

                  </div>
                )})
              )}
            </div>
          </div>
        )}

        {/* Intel Tab */}
        {activeTab === 'intel' && (
          <div className="space-y-4">
            {/* Collapsible Intel Sections */}

            {/* Simulation Log */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <button
                onClick={() => toggleSection('simlog')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-tactical-accent" />
                  <span className="font-bold text-white text-sm uppercase">Simulation Log</span>
                </div>
                {expandedSections.has('simlog') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {expandedSections.has('simlog') && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="pt-3 border-t border-gray-700">
                    <div className="text-sm text-gray-400 font-mono bg-gray-900/50 p-4 rounded border border-gray-700/50 whitespace-pre-wrap">
                      {Array.isArray(result.simulationLog) ? result.simulationLog.join('\n\n') : result.simulationLog}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ration Plan */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <button
                onClick={() => toggleSection('rations')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Droplets className="w-5 h-5 text-tactical-accent" />
                  <span className="font-bold text-white text-sm uppercase">Ration Plan</span>
                </div>
                {expandedSections.has('rations') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {expandedSections.has('rations') && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="pt-3 border-t border-gray-700">
                    <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded text-sm text-blue-200 whitespace-pre-wrap">
                      {result.rationPlan}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Critical Skills Tab */}
        {activeTab === 'skills' && (
          <CriticalSkills
            skills={result.requiredSkills || []}
            scenarios={result.scenarios || []}
            skillResources={result.skillResources}
          />
        )}
      </div>
    </div>
  );
};

export default MissionReport;
