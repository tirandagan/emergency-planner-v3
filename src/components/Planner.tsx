"use client";

import React, { useState, useEffect } from 'react';
import { generateSurvivalPlan, enrichSurvivalPlanWithResources, validateLocation } from '@/app/actions';
import { ScenarioType, MobilityType, Person } from '@/types';
import { loadingTips } from '@/data/loadingTips';
import { useRouter } from 'next/navigation';
import {
  Loader2, CheckCircle2,
  BrainCircuit, ShieldAlert,
  CloudLightning, Skull, Users, Zap, Flame, Home, Footprints,
  Car, ChevronRight, ChevronLeft, MapPin, Activity,
  Baby, Syringe, User, Trash2, Plus
} from 'lucide-react';
import LocationAutocomplete from './LocationAutocomplete';

// Storage key for temporary report data
const REPORT_STORAGE_KEY = 'beprepared_temp_report';

const Planner: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("ESTABLISHING SAT-LINK...");

  // Form State
  const [scenarios, setScenarios] = useState<ScenarioType[]>([]);
  const [location, setLocation] = useState('');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [displayedTips, setDisplayedTips] = useState<string[]>([]);

  // Rotate tips while loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      // Shuffle tips to show in random order
      const shuffled = [...loadingTips].sort(() => Math.random() - 0.5);
      setDisplayedTips(shuffled);
      setCurrentTipIndex(0);

      interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % shuffled.length);
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [loading]);
  
  // Personnel State
  const [personnel, setPersonnel] = useState<Person[]>([
    { id: '1', gender: 'Male', age: 'Adult', medical: false }
  ]);
  
  const [duration, setDuration] = useState(7);
  const [mobility, setMobility] = useState<MobilityType>(MobilityType.BUG_OUT_VEHICLE);
  const [budgetAmount, setBudgetAmount] = useState(2000);
  const [prepTime, setPrepTime] = useState('Medium Term');

  // Derived family size
  const familySize = personnel.length;

  const getScenarioIcon = (type: ScenarioType) => {
    switch (type) {
      case ScenarioType.NATURAL_DISASTER: return <CloudLightning className="w-8 h-8" />;
      case ScenarioType.PANDEMIC: return <Skull className="w-8 h-8" />;
      case ScenarioType.CIVIL_UNREST: return <Users className="w-8 h-8" />;
      case ScenarioType.EMP: return <Zap className="w-8 h-8" />;
      case ScenarioType.NUCLEAR: return <Flame className="w-8 h-8" />;
      default: return <ShieldAlert className="w-8 h-8" />;
    }
  };

  const toggleScenario = (type: ScenarioType) => {
    if (scenarios.includes(type)) {
      if (scenarios.length > 1) {
        setScenarios(scenarios.filter(s => s !== type));
      }
    } else {
      setScenarios([...scenarios, type]);
    }
  };

  const executeAnalysis = async () => {
    // Validate location specificity for evacuation routes
    if (mobility !== MobilityType.BUG_IN) {
      setLoading(true);
      setLoadingStatus("VALIDATING TARGET LOCATION...");
      try {
        const check = await validateLocation(location);
        if (!check.valid) {
          alert(check.message || "Please provide a more specific location (City, County, or Address) for evacuation routing.");
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Location validation error", e);
      }
      // Keep loading true, just update status
    }

    // Construct special needs string array
    const specialNeedsList: string[] = [];
    
    personnel.forEach(p => {
      let desc = `${p.age} ${p.gender}`;
      if (p.medical) desc += " (Chronic Medical)";
      specialNeedsList.push(desc);
    });

    setLoading(true);
    setLoadingStatus("GENERATING SURVIVAL PLAN...");

    try {
      // Step 1: Generate Core Plan
      const plan = await generateSurvivalPlan(
        familySize,
        location,
        duration,
        scenarios,
        mobility,
        specialNeedsList,
        budgetAmount,
        prepTime,
        personnel
      );

      // Step 2: Fetch and Select Resources
      setLoadingStatus("GATHERING INTEL & RESOURCES...");
      const enrichedPlan = await enrichSurvivalPlanWithResources(plan);

      // Store result in localStorage for the report page
      const reportData = {
        result: enrichedPlan,
        location,
        duration,
        familySize,
        scenarios: scenarios.map(s => s.toString()),
        mobility,
        budgetAmount,
        personnel,
        prepTime
      };
      localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reportData));

      // Navigate to report page
      router.push('/planner/report');
    } catch (err) {
      console.error(err);
      alert("Failed to generate survival plan. Please try again.");
      setLoading(false);
    }
  };

  // --- PERSONNEL HELPERS ---
  const addPerson = () => {
    const newId = (Math.max(...personnel.map(p => parseInt(p.id))) + 1).toString();
    setPersonnel([...personnel, { id: newId, gender: 'Male', age: 'Adult', medical: false }]);
  };

  const removePerson = (id: string) => {
    if (personnel.length > 1) {
      setPersonnel(personnel.filter(p => p.id !== id));
    }
  };

  const updatePerson = (id: string, field: keyof Person, value: any) => {
    setPersonnel(personnel.map(p => {
      if (p.id !== id) return p;
      return { ...p, [field]: value };
    }));
  };

  // --- WIZARD STEPS ---

  const renderStep1 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground">Scenario Selection</h2>
        <p className="text-muted-foreground mt-2">Choose one or more emergency scenarios to plan for ({scenarios.length} selected)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.values(ScenarioType).map((t) => (
          <button
            key={t}
            onClick={() => toggleScenario(t)}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all relative ${scenarios.includes(t)
              ? 'border-primary bg-primary/10 text-card-foreground shadow-lg'
              : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-muted'
              }`}
          >
            {scenarios.includes(t) && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
            )}
            {getScenarioIcon(t)}
            <span className="text-xs font-medium tracking-wide text-center">{t}</span>
          </button>
        ))}
      </div>

      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <MapPin className="w-4 h-4 text-primary" /> Location
        </label>
        <LocationAutocomplete
          value={location}
          onChange={(value) => setLocation(value)}
          placeholder="Search for a city, address, or neighborhood..."
          required
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => location && setStep(2)}
          disabled={!location || scenarios.length === 0}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          Next Step <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground">Family Members</h2>
        <p className="text-muted-foreground mt-2">Configure profile for each person in your household.</p>
      </div>

      <div className="space-y-4">
        {personnel.map((p, index) => (
           <div key={p.id} className="bg-card border border-border rounded-xl p-4 shadow-sm animate-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between gap-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold border border-primary/20">
                       {index + 1}
                    </div>
                    <span className="font-semibold text-card-foreground">Person #{index + 1}</span>
                 </div>
                 {personnel.length > 1 && (
                    <button onClick={() => removePerson(p.id)} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove person">
                       <Trash2 className="w-5 h-5" />
                    </button>
                 )}
              </div>

              <div className="flex flex-col gap-3 mt-4">
                 {/* Top Row: Gender and Medical */}
                 <div className="flex gap-3">
                    {/* Gender Selection */}
                    <div className="flex flex-1 gap-1 bg-muted p-1 rounded-lg">
                        {['Male', 'Female'].map((g) => (
                          <button
                              key={g}
                              onClick={() => updatePerson(p.id, 'gender', g)}
                              className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${p.gender === g ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                              {g}
                          </button>
                        ))}
                    </div>

                    {/* Medical Toggle - Compact */}
                    <button
                        onClick={() => updatePerson(p.id, 'medical', !p.medical)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${p.medical ? 'bg-destructive/10 border-destructive text-destructive' : 'bg-muted border-border text-muted-foreground hover:text-foreground'}`}
                        title="Chronic Medical Condition"
                    >
                        <Syringe className="w-4 h-4" />
                        <span className="text-[10px] font-medium hidden sm:inline">Medical</span>
                    </button>
                 </div>

                 {/* Bottom Row: Age Selection (Wraps naturally) */}
                 <div className="flex flex-wrap gap-2 bg-muted p-1 rounded-lg">
                    {['Infant/Toddler', 'Child', 'Adult', 'Elderly/Mobility'].map((a) => (
                       <button
                          key={a}
                          onClick={() => updatePerson(p.id, 'age', a)}
                          className={`flex-grow sm:flex-1 py-2 px-2 text-[10px] font-medium rounded transition-colors whitespace-nowrap ${p.age === a ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                       >
                          {a === 'Elderly/Mobility' ? 'Elderly' : a}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        ))}

        <button
           onClick={addPerson}
           className="w-full py-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 font-medium"
        >
           <Plus className="w-5 h-5" /> Add Person
        </button>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-4 py-3 font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <button
          onClick={() => setStep(3)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md"
        >
          Next Step <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground">Plan Details</h2>
        <p className="text-muted-foreground mt-2">Configure timeline, mobility, and budget parameters.</p>
      </div>

      {/* Duration Slider */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <div className="flex justify-between items-end mb-4">
          <label className="text-sm font-semibold text-foreground">Duration</label>
          <span className="text-2xl font-bold text-foreground">{duration} <span className="text-sm text-muted-foreground">days</span></span>
        </div>
        <input
          type="range"
          min="3"
          max="90"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>72 hrs</span>
          <span>1 month</span>
          <span>3 months</span>
        </div>
      </div>

      {/* Mobility Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { type: MobilityType.BUG_IN, icon: <Home className="w-6 h-6" />, label: "Bug In" },
          { type: MobilityType.BUG_OUT_FOOT, icon: <Footprints className="w-6 h-6" />, label: "On Foot" },
          { type: MobilityType.BUG_OUT_VEHICLE, icon: <Car className="w-6 h-6" />, label: "Vehicle" }
        ].map((m) => (
          <button
            key={m.type}
            onClick={() => setMobility(m.type)}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${mobility === m.type
              ? 'bg-success/10 border-success text-success-foreground'
              : 'bg-card border-border text-muted-foreground hover:bg-muted'
              }`}
          >
            {m.icon}
            <span className="text-xs font-medium text-center leading-tight">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Budget Limit */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <div className="flex justify-between items-end mb-2">
          <label className="text-sm font-semibold text-foreground">Budget Limit</label>
          <span className="text-xl font-bold text-foreground">${budgetAmount}</span>
        </div>
        <input
          type="range"
          min="100"
          max="20000"
          step="100"
          value={budgetAmount}
          onChange={(e) => setBudgetAmount(parseInt(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary mb-3"
        />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[500, 2000, 5000, 10000].map(amount => (
            <button
              key={amount}
              onClick={() => setBudgetAmount(amount)}
              className={`px-3 py-1 rounded text-xs border transition-colors ${budgetAmount === amount
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>

      {/* Preparation Time Horizon */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <label className="text-sm font-semibold text-foreground mb-4 block">Preparation Time Available</label>
        <div className="grid grid-cols-2 gap-3">
          {['Immediate (< 24 Hrs)', 'Short Term (1-2 Weeks)', 'Medium Term (1-6 Months)', 'Long Term (6+ Months)'].map((time) => (
            <button
              key={time}
              onClick={() => setPrepTime(time)}
              className={`p-3 rounded-lg border text-xs font-medium transition-all ${prepTime === time
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-muted border-border text-muted-foreground hover:bg-card'
                }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setStep(2)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-4 py-3 font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <button
          onClick={executeAnalysis}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md"
        >
          Generate Plan <BrainCircuit className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background">
        <div className="relative">
          <div className="absolute inset-0 bg-primary blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="h-24 w-24 text-primary animate-spin relative z-10" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mt-8 animate-pulse">{loadingStatus}</h2>
        <div className="mt-4 min-h-[60px] flex items-center justify-center">
          <p 
            key={currentTipIndex}
            className="text-muted-foreground text-sm max-w-md text-center animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <span className="text-primary font-semibold mr-2">TIP:</span> 
            {displayedTips[currentTipIndex] || loadingTips[0]}
          </p>
        </div>
        <div className="mt-8 w-64 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 bg-background min-h-screen">
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};

export default Planner;
