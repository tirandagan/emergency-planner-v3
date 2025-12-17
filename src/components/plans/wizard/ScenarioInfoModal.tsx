"use client";

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { ScenarioType } from '@/types/wizard';

interface ScenarioInfoModalProps {
  scenario: ScenarioType | null;
  isOpen: boolean;
  onClose: () => void;
}

// Scenario content mapping - this will be rendered as formatted content
const SCENARIO_CONTENT: Record<
  ScenarioType,
  {
    title: string;
    icon: string;
    color: string;
    summary: string;
    sections: Array<{ title: string; content: string | string[] }>;
  }
> = {
  'natural-disaster': {
    title: 'Natural Disaster Preparedness',
    icon: '🌪️',
    color: 'text-blue-600 dark:text-blue-400',
    summary:
      'Natural disasters include hurricanes, earthquakes, tornadoes, floods, wildfires, and severe winter storms. These events are location-specific, often provide some warning time, and typically affect infrastructure (power, water, roads) for 3-14 days.',
    sections: [
      {
        title: 'Critical Decision: Shelter-in-Place vs Evacuation',
        content:
          'The most important decision for natural disasters is whether to stay or go. Your plan must address BOTH scenarios with clear decision criteria.',
      },
      {
        title: 'Shelter-in-Place Indicators',
        content: [
          'Local authorities recommend staying',
          'Property is structurally sound and above flood zones',
          'Adequate supplies can be stored safely',
          'Medical needs can be managed at home',
          'Roads may be impassable or dangerous',
        ],
      },
      {
        title: 'Evacuation Indicators',
        content: [
          'Mandatory evacuation orders issued',
          'Property in high-risk zone (flood plain, wildfire path, coastal)',
          'Structural damage imminent (earthquake aftershocks, hurricane winds)',
          'Medical needs require hospital proximity',
          'Safe evacuation routes available with sufficient warning time',
        ],
      },
      {
        title: 'Supply Priorities (First 72 Hours)',
        content: [
          'Water: 1 gallon per person per day × 3 days',
          'Food: Non-perishable, no-cook options',
          'Light: Flashlights, batteries, headlamps (power outage likely)',
          'First Aid: Trauma kit for injury-prone scenarios',
          'Communication: Battery/hand-crank weather radio',
          'Shelter: Emergency blankets, tarps for structural damage',
          'Sanitation: Portable toilet, bags, sanitizer',
        ],
      },
      {
        title: 'Psychological Preparedness',
        content:
          'Natural disasters are traumatic. Your plan should include stress management, routine maintenance, regular family communication, entertainment, comfort foods, and familiar items to maintain morale during the crisis.',
      },
    ],
  },
  'emp-grid-down': {
    title: 'EMP / Grid Down Preparedness',
    icon: '⚡',
    color: 'text-yellow-600 dark:text-yellow-400',
    summary:
      'An Electromagnetic Pulse (EMP) or prolonged grid-down situation would disable most electronics and electrical infrastructure. This scenario requires preparation for long-term (months to years) self-sufficiency without modern conveniences.',
    sections: [
      {
        title: 'Critical Understanding',
        content:
          'This is the MOST challenging scenario because most electronics fail, power grid may be down for months/years, supply chains collapse within days, long-term sustainability is required, communication systems fail, and social instability may occur.',
      },
      {
        title: 'Immediate Post-EMP Reality (First 72 Hours)',
        content: [
          'Electronics fail - anything with microchips (newer cars, phones, computers)',
          'Power grid down - instantaneous nationwide blackout',
          'Water systems fail - pumps stop, taps run dry within hours',
          'Stores emptied - panic buying clears shelves in 24-48 hours',
          'Gas stations useless - no power for pumps',
          'Banking system down - no ATMs, cards, or electronic payments',
          'Communication blackout - no phone, internet, or broadcasts',
          'Emergency services overwhelmed - 911 may not function',
        ],
      },
      {
        title: 'Faraday Protection (CRITICAL)',
        content:
          'Store duplicates of critical electronics in Faraday cages: ham radio, FRS radios, AM/FM radio, solar charge controllers, LED flashlights, USB drives with survival manuals, and medical devices. DIY Faraday: use metal trash can with cardboard insulation, wrap items in plastic then foil.',
      },
      {
        title: 'Supply Priorities - Water (MOST CRITICAL)',
        content: [
          'Storage: 1 gallon/person/day × 30+ days',
          'Purification: 3+ methods (boiling, filter, chemical tablets)',
          'Sources: Identify local sources (streams, ponds, wells)',
          'Collection: Rain catchment system, tarps, containers',
        ],
      },
      {
        title: 'Communication Without Electronics',
        content:
          'Ham Radio (HIGHEST PRIORITY): Get FCC license NOW, store equipment in Faraday cage, practice regularly. Alternative: CB Radio (no license, 5-20 miles), FRS/GMRS radios (family communication), signal mirrors, whistles, and community bulletin boards.',
      },
      {
        title: 'Skills to Learn NOW',
        content: [
          'Ham radio operation - communication is critical',
          'Food preservation - canning, smoking, drying',
          'Gardening - start NOW, learn by doing',
          'First aid/CPR - medical care essential',
          'Water purification - multiple methods',
          'Fire starting - without matches/lighters',
          'Basic repairs - mechanical, electrical, plumbing',
        ],
      },
    ],
  },
  pandemic: {
    title: 'Pandemic Preparedness',
    icon: '🦠',
    color: 'text-red-600 dark:text-red-400',
    summary:
      'Pandemics are infectious disease outbreaks that spread widely across regions or globally. Unlike other disasters, pandemics require isolation and quarantine rather than evacuation, last for weeks to months, and demand strict hygiene and medical protocols.',
    sections: [
      {
        title: 'Critical Understanding',
        content:
          'Pandemic preparedness is fundamentally different: isolation required (stay home 30-90+ days), no evacuation (leaving increases exposure risk), medical focus (PPE, sanitation, disease prevention), supply chain disruption, healthcare overwhelm, social distancing, and long duration (multiple waves over 12-24 months).',
      },
      {
        title: 'Immediate Response (First 24 Hours)',
        content: [
          'Complete supply run IMMEDIATELY - before panic buying empties shelves',
          'Cancel all non-essential activities - work from home, school remote',
          'Establish quarantine zone - designate entry area for disinfection',
          'Stock up on PPE - whatever is still available (masks, gloves, sanitizer)',
          'Prepare isolation room - if household member gets sick',
          'Communication plan - set up video calls with family',
          'Medical baseline - take temperatures, document any symptoms',
        ],
      },
      {
        title: 'PPE (HIGHEST PRIORITY)',
        content: [
          'Masks: N95 or KN95 (50+ per person), cloth masks as backup',
          'Gloves: Disposable nitrile (500+ count)',
          'Hand Sanitizer: Multiple gallons (alcohol-based 60%+)',
          'Disinfecting Supplies: Bleach (1 gallon), disinfecting wipes (10+ containers), spray bottles, paper towels (50+ rolls)',
        ],
      },
      {
        title: 'Quarantine Zone Setup',
        content:
          'Contamination Zone (Outside/Entry): Remove outer clothing and shoes, disinfect packages/groceries, remove gloves and mask properly. Transition Zone: Wash hands thoroughly (20 seconds), disinfect phone/keys/wallet, change into indoor clothing. Clean Zone: Only enter after complete decontamination.',
      },
      {
        title: 'Isolation Room (If Household Member Sick)',
        content: [
          'Separate bedroom with door',
          'Dedicated bathroom if possible',
          'Air circulation: Open window, fan outward',
          'Supplies inside: Water, meds, tissues, waste bag',
          'Communication: Phone/intercom (avoid face-to-face)',
          'PPE for caregivers: N95, gloves, gown when entering',
          'ONE designated caregiver (limit exposure)',
        ],
      },
      {
        title: 'Psychological Preparedness',
        content:
          'Combat isolation stress with routine (wake/sleep same time, get dressed, structured schedule), social connection (daily video calls, virtual events, online communities), mental health monitoring, exercise, and maintaining purpose through assigned responsibilities.',
      },
    ],
  },
  nuclear: {
    title: 'CBRN Event Preparedness',
    icon: '☢️',
    color: 'text-orange-600 dark:text-orange-400',
    summary:
      'CBRN (Chemical, Biological, Radiological, Nuclear) events include nuclear weapon detonation, nuclear power plant accidents, radiological "dirty bombs", or chemical attacks. Survival depends on immediate shelter, understanding fallout timing, and decontamination protocols.',
    sections: [
      {
        title: 'The 7-10 Rule of Radiation Decay',
        content:
          'MOST IMPORTANT CONCEPT: For every 7-fold increase in time, radiation intensity drops by a factor of 10. 1 hour after = 100%, 7 hours after = 10%, 49 hours (2 days) = 1%, 2 weeks = 0.1%. This means: First 48 hours STAY SHELTERED (deadly outside), Days 3-14 carefully venture out only if necessary, After 2 weeks radiation significantly reduced.',
      },
      {
        title: 'Immediate Response Timeline',
        content: [
          'T-0 (Flash Detected): Look away immediately, drop and cover, protect head/neck',
          'T+0 to T+15 minutes: GET INDOORS NOW - fallout arrives in 15-60 minutes',
          'Seal the room: Close windows/doors, turn off HVAC, seal vents, close fireplace dampers',
          'Move to shelter: Basement center (best), first floor interior room, interior bathroom',
          'Gather supplies: Water, food, flashlights, radio, first aid, buckets for waste',
        ],
      },
      {
        title: 'Absolute Shelter Period (48 Hours)',
        content:
          'DO NOT GO OUTSIDE. DO NOT OPEN WINDOWS. DO NOT LEAVE SHELTER. Radiation outside is DEADLY during this period. Stay in shelter 24/7, use emergency toilet (bucket with bags), ration water and food, monitor radio for instructions, take potassium iodide if available (within 3-4 hours).',
      },
      {
        title: 'Shelter Protection Factor (SPF)',
        content: [
          'Vehicle: SPF 2 (minimal protection)',
          'Wood frame house: SPF 2-5',
          'Brick house basement: SPF 40-200 (excellent)',
          'Concrete building center: SPF 50-100',
          'Underground shelter: SPF 1000+ (best)',
        ],
      },
      {
        title: 'Decontamination Protocols (CRITICAL)',
        content:
          'After ANY outdoor exposure: Remove ALL outer clothing outside (seal in plastic bag), brush off visible dust gently, shower with soap (2-3 times for hair, NO conditioner), scrub entire body, rinse 5+ minutes, dry with clean towel, PUT ON CLEAN CLOTHES. If no shower: wet washcloths, clean face/hands/exposed skin, change into clean clothes. Decontamination can reduce exposure by 90%+.',
      },
      {
        title: 'Potassium Iodide (KI) Tablets',
        content:
          'Purpose: Protects thyroid from radioactive iodine. Timing critical: Take within 3-4 hours of exposure. Dosage: Adults 130mg, Children 3-18 years 65mg, Children 1mo-3yr 32mg, Infants under 1mo 16mg. Store pre-purchased KI tablets (Amazon, pharmacies), 5-7 year shelf life, inexpensive ($10-20 for family pack).',
      },
      {
        title: 'Critical Supplies',
        content: [
          'Water: 14+ days (1 gal/person/day)',
          'Food: 14+ days shelf-stable',
          'KI tablets: Correct doses for all family members',
          'N95 masks: 50+ (prevent inhaling particles)',
          'Plastic sheeting and duct tape: Seal shelter',
          'Battery/hand-crank radio: NOAA alerts',
          'First aid kit: Comprehensive',
          'Decontamination: Soap, bleach, wipes, gloves',
        ],
      },
    ],
  },
  'civil-unrest': {
    title: 'Civil Unrest Preparedness',
    icon: '⚠️',
    color: 'text-purple-600 dark:text-purple-400',
    summary:
      'Civil unrest includes protests, riots, civil disorder, economic collapse, martial law, and social instability. These are human-caused events where personal security, low profile, and situational awareness are critical. Duration can range from days to weeks with little to no warning.',
    sections: [
      {
        title: 'Critical Understanding',
        content:
          'Civil unrest preparedness is fundamentally about avoiding danger and conflict: Personal safety first, low profile (don\'t attract attention), multiple exit strategies, situational awareness, "gray man" concept (blend in), home security without escalation, and resource invisibility.',
      },
      {
        title: 'Warning Signs of Escalating Unrest',
        content: [
          'Early Indicators: Large protests announced, social media coordination, political/economic tensions, police presence increasing, supply shortages',
          'Immediate Indicators (Get to Safety NOW): Crowds turning aggressive, property damage, looting, police riot control, gunfire, roadblocks, emergency services overwhelmed',
        ],
      },
      {
        title: 'Your Immediate Response (If at Home)',
        content: [
          'Stay home - safest place during unrest',
          'Secure property: Lock all doors/windows, close curtains (hide valuables), move vehicles to garage',
          'Turn off exterior lights - don\'t attract attention',
          'Monitor situation: Local news, police scanner, social media',
          'Stay out of sight: Keep noise down, minimal lights (internal only)',
        ],
      },
      {
        title: 'The OODA Loop (Observe, Orient, Decide, Act)',
        content:
          'Observe: What\'s happening? Where are threats? What are exit routes? Orient: What does this mean? How does it affect safety? Decide: Best action (stay, leave, defend)? Backup plan? Act: Execute decision calmly and quickly, adapt as situation changes.',
      },
      {
        title: 'Home Security (Without Escalation)',
        content:
          'Goal: Deter, not Engage. Make your home look occupied, secure (not easy target), low-value (nothing obvious to steal), and risky (dog, cameras, occupied neighbors). AVOID: Fortified appearance (attracts attention), confrontation (violence begets violence), solo defense.',
      },
      {
        title: 'Layered Security Approach',
        content: [
          'Layer 1 - Deterrence: Keep low profile, ordinary appearance, signs of occupancy',
          'Layer 2 - Delay: Reinforced doors/locks, window locks/bars (interior), thorny plants',
          'Layer 3 - Detection: Security cameras, motion sensors, dogs or dog alarms',
          'Layer 4 - Response: Safe room (reinforced interior), call 911, appropriate defensive measures',
        ],
      },
      {
        title: 'Evacuation Strategy',
        content: [
          'Evacuate If: Direct threats, fire approaching, unrest escalating in your area, police advise leaving',
          'Do NOT Evacuate If: Unrest hasn\'t reached you, roads more dangerous, home provides adequate safety',
          'Evacuation Execution: Leave early or wait, full tank, doors locked, avoid downtown/protest areas, take backroads, ordinary vehicle/clothes (gray man principle)',
        ],
      },
      {
        title: 'Essential Supplies',
        content: [
          'Cash: $500-1,000 in small bills (ATMs may be down)',
          'Food/Water: 7-14 days (NO COOKING - avoid smoke/smells)',
          'First aid: Comprehensive trauma kit',
          'Fire extinguisher: Multiple (arson risk)',
          'Home security: Reinforced doors, window locks, cameras',
          'Communication: Cell phone, two-way radios, police scanner',
        ],
      },
    ],
  },
  'multi-year-sustainability': {
    title: 'Multi-Year Sustainability',
    icon: '🌱',
    color: 'text-green-600 dark:text-green-400',
    summary:
      'Multi-year sustainability planning prepares for prolonged societal disruption lasting months to years. This could result from economic collapse, extended grid failure, cascading infrastructure breakdown, or long-term resource scarcity. The focus shifts from "surviving an event" to sustainable living.',
    sections: [
      {
        title: 'Critical Understanding',
        content:
          'Multi-year preparedness is fundamentally different: Self-sufficiency required (cannot buy what you need), skills over supplies (knowledge trumps stockpiles), food production (must grow/raise own calories), community essential (no one survives alone long-term), adaptability critical, psychological resilience, and generational thinking.',
      },
      {
        title: 'Reality Check',
        content:
          'Complete self-sufficiency is nearly impossible. Even subsistence farmers relied on communities, trade networks, and specialized skills. Your goal is MAXIMUM SELF-RELIANCE WITH STRATEGIC INTERDEPENDENCE.',
      },
      {
        title: 'Food Production Strategy (4-Pronged Approach)',
        content: [
          '1. Gardening (Primary Calories): 600-1000 sq ft per person, priority crops (potatoes, corn, beans, winter squash, cabbage), succession planting, year-round production, HEIRLOOM seeds only (can save seeds)',
          '2. Livestock (Protein/Fats): Chickens (easiest, 6 hens = 4-5 eggs/day), Rabbits (1 doe = 40-50 lbs meat/year), Goats (2-3 quarts milk/day, advanced)',
          '3. Foraging (Supplemental): Wild edibles, fishing, hunting (if legal/experienced), mushrooms ONLY if expert',
          '4. Food Preservation (Critical): Canning (pressure canner essential), drying, smoking, root cellar, fermentation, salt curing',
        ],
      },
      {
        title: 'Sustainable Water Sources',
        content: [
          'Well (Best): Hand pump or windmill, professional or DIY shallow well, $3,000-15,000+ or $500-2,000 DIY',
          'Spring/Stream: Natural flowing water, requires filtration/purification, may be seasonal',
          'Rainwater Catchment: Roof collection (2,000 sq ft roof + 1" rain = 1,250 gallons), storage tanks, filtration required',
          'Pond/Lake: Large volume but requires significant filtration, contamination concerns',
        ],
      },
      {
        title: 'Year 1 Essential Skills (Start Immediately)',
        content: [
          'Gardening - plant, tend, harvest (PRACTICE NOW)',
          'Food preservation - canning, drying, fermentation (LEARN BY DOING)',
          'Animal husbandry - chickens basics',
          'Seed saving - preserve seeds for next season',
          'Cooking from scratch - no convenience foods',
          'Water purification - multiple methods',
          'Basic carpentry - repairs, construction',
          'First aid - extended medical scenarios',
        ],
      },
      {
        title: 'Why Community is Essential',
        content:
          'No one has all skills. Division of labor increases efficiency. Security through numbers. Psychological support. Pre-Event: Meet neighbors, identify skills, practice cooperation. Post-Event: Community meetings, skill inventory, trade system, security coordination, conflict resolution.',
      },
      {
        title: 'Barter Economy - High-Value Trade Goods',
        content: [
          'Food surplus, seeds, preserved foods',
          'Alcohol (morale, disinfectant, fuel)',
          'Tobacco, coffee (extreme value)',
          'Salt (preservation essential), spices',
          'Medicine/first aid supplies',
          'Tools (quality, maintained)',
          'Ammunition (if applicable)',
          'Soap, clothing items',
        ],
      },
      {
        title: 'Psychological Resilience',
        content:
          'Hardest part: Loss of modern conveniences, constant physical labor, uncertainty and fear, grief for old life. Strategies: Purpose and routine (structured schedule, goals, celebrate victories), social connection (community gatherings, shared meals, activities), stress management (exercise, nature, journaling, creativity), meaning making (legacy thinking, teaching, community contribution).',
      },
    ],
  },
};

export function ScenarioInfoModal({ scenario, isOpen, onClose }: ScenarioInfoModalProps) {
  if (!scenario) return null;

  const content = SCENARIO_CONTENT[scenario];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 pr-8">
            <span className="text-4xl">{content.icon}</span>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {content.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detailed information about {content.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4 space-y-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {/* Summary Section */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {content.summary}
                </p>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-5">
              {content.sections.map((section, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs"
                    >
                      {index + 1}
                    </Badge>
                    {section.title}
                  </h3>

                  {Array.isArray(section.content) ? (
                    <ul className="space-y-2 ml-8">
                      {section.content.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex items-start gap-2"
                        >
                          <span className="text-primary font-bold mt-0.5">•</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed ml-8">
                      {section.content}
                    </p>
                  )}
                </div>
              ))}
            </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-500 text-center italic">
              This is a summary overview. Your personalized plan will include detailed, actionable
              steps tailored to your specific situation, location, and family needs.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
