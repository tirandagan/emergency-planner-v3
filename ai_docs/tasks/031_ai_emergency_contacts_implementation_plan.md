# Task 031: AI-Powered Emergency Contact Recommendations - Implementation Plan

**Status**: Ready for Implementation
**Priority**: High
**Estimated Time**: 4-5 days
**Assigned**: Development Team

---

## Executive Summary

Implement AI-powered emergency contact recommendations with Google Places integration as a **Basic+ premium feature**. The system generates personalized emergency contact lists by combining:
- **Static universal contacts** (911, poison control, FEMA) - TypeScript constants, zero cost
- **Google Places NearbySearch API** results (local hospitals, fire stations) - ~$0.01/call with caching
- **Claude Haiku AI analysis** - ~$0.00375/call

**Total Cost per Generation**: ~$0.01375 (with 70% cache hit rate)

**Scope Additions**:
- Family member locations (post-generation enrichment)
- Basic notes capability for contacts
- Extensible tier-based prompt system

---

## Design Decisions (User Confirmed)

1. **Google API Key**: ✅ Use existing `NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY` (Places API enabled)

2. **Caching Strategy**: ✅ Database cache with:
   - Automatic expiration via PostgreSQL trigger
   - Row limit (10,000 entries max) to prevent table bloat
   - TTL: 7 days
   - GIN indexes for efficient JSONB queries

3. **Phone Number Format**: ✅ International format with user override
   - Default: +1 for US numbers
   - Stored format allows country code customization
   - `tel:` protocol for click-to-call

4. **Tier Gating Strategy**: ✅ Preview model for FREE users
   - Generate 5 sample emergency contacts (static + top-rated Google Places)
   - Show "This is X of Y total contacts" messaging
   - Prominent upgrade CTA with benefit preview
   - Full generation (10-15 contacts) for BASIC users
   - Comprehensive (15-25 contacts) for PRO users

5. **Tab Icon**: ✅ `Shield` icon (safety/protection emphasis)

6. **Static Contacts Coverage**: ✅ Top 20 US states by population
   - Compiled from trusted government sources:
     - FEMA, NRC, remm.hhs.gov, EPA, National Weather Service
     - State emergency management agencies
   - Stored as TypeScript constants (not database)
   - Expandable to all 50 states in future releases

7. **Meeting Location Count**: ✅ 1-3 locations (flexible based on availability)
   - AI determines optimal count based on location density
   - Future enhancement: Consider family member locations for meeting point selection

8. **User Tier Access**: ✅ Server-side protection (query from database)
   - Tier queried in `/api/generate-mission` route
   - Tier-specific prompt variables for LLM instruction
   - Client-side tier cannot be trusted (security)

---

## Architecture: Three-Tier Data System

### How Emergency Contacts Are Generated

**Layer 1: Static Contacts (TypeScript Constants)**
- Stored in code as TypeScript objects (not database)
- Universal contacts: 911, Poison Control, FEMA, Red Cross, CDC, 988 Lifeline
- State-level: Top 20 state emergency management agencies
- Always included, zero cost, instant availability
- **Purpose**: Baseline safety net that works even if APIs fail

**Layer 2: Google Places API (Dynamic Local Data)**
- Fetched per generation based on user coordinates
- Returns: Local hospitals, fire stations, pharmacies, parks, libraries
- Cached in DATABASE for 7 days (with automatic cleanup trigger)
- Cost: ~$0.01 per generation (70% cache hit rate)
- **Purpose**: Personalized local emergency services

**Layer 3: AI Analysis (Claude Haiku)**
- Input: Static contacts + Google Places results + user context (scenarios, location, family size)
- Process: Analyzes all sources, adds reasoning, calculates fit scores, prioritizes by tier
- Output: Ranked, prioritized contacts with AI explanations + 1-3 meeting location recommendations
- Cost: ~$0.00375 per generation
- **Purpose**: Intelligent selection and personalization

**Key Point**: The AI doesn't generate phone numbers - it analyzes and selects from real data sources (static + Google Places).

---

## Phase 0: Database Schema Changes

### 0.1 Add user_enrichments Column to mission_reports

**Migration Command**: `npm run db:generate`

**SQL Schema**:
```sql
-- Add user_enrichments JSONB column
ALTER TABLE mission_reports
ADD COLUMN user_enrichments JSONB DEFAULT '{"familyMembers": [], "notes": []}'::jsonb;

-- Create GIN index for JSONB queries
CREATE INDEX idx_mission_reports_user_enrichments
ON mission_reports USING GIN (user_enrichments);

-- Optional: Specific indexes for common queries
CREATE INDEX idx_mission_reports_enrichments_family
ON mission_reports USING GIN ((user_enrichments->'familyMembers'));

CREATE INDEX idx_mission_reports_enrichments_notes
ON mission_reports USING GIN ((user_enrichments->'notes'));
```

**Drizzle Schema Update** (`src/db/schema/mission-reports.ts`):
```typescript
export const missionReports = pgTable('mission_reports', {
  // ... existing columns
  userEnrichments: jsonb('user_enrichments').$type<UserEnrichments>()
    .default({ familyMembers: [], notes: [] }),
});

// Type definition
export type UserEnrichments = {
  familyMembers: Array<{
    id: string;
    name: string;
    relationship: string;
    location: {
      address: string;
      coordinates: { lat: number; lng: number };
    };
    phone?: string;
  }>;
  notes: Array<{
    id: string;
    sectionType: 'contact' | 'bundle' | 'skill' | 'general';
    targetId?: string;
    content: string;
    createdAt: string;
  }>;
};
```

**Rationale for Separation**:
- `formData`: Original wizard inputs (used for generation)
- `user_enrichments`: Post-generation additions (preserved on regeneration)
- Allows: Copying enrichments to new reports, regenerating with same overlay

### 0.2 Create Google Places Cache Table

**New Schema File**: `src/db/schema/google-places-cache.ts`

**SQL Schema**:
```sql
CREATE TABLE google_places_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  place_results JSONB NOT NULL,
  cached_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  hit_count INTEGER DEFAULT 1
);

-- Indexes
CREATE INDEX idx_places_cache_key ON google_places_cache(cache_key);
CREATE INDEX idx_places_cache_expires ON google_places_cache(expires_at);

-- Automatic cleanup trigger for expired entries
CREATE OR REPLACE FUNCTION cleanup_expired_places_cache()
RETURNS trigger AS $$
BEGIN
  DELETE FROM google_places_cache WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_expired_places
AFTER INSERT ON google_places_cache
EXECUTE FUNCTION cleanup_expired_places_cache();

-- Limit cache table size (10,000 entries max)
CREATE OR REPLACE FUNCTION limit_places_cache_size()
RETURNS trigger AS $$
BEGIN
  DELETE FROM google_places_cache
  WHERE id NOT IN (
    SELECT id FROM google_places_cache
    ORDER BY cached_at DESC
    LIMIT 10000
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_limit_places_cache
AFTER INSERT ON google_places_cache
EXECUTE FUNCTION limit_places_cache_size();
```

**Cache Key Format**:
```typescript
function getCacheKey(lat: number, lng: number, radius: number, types: string[]): string {
  const roundedLat = Math.round(lat * 10) / 10;  // Round to 0.1 degree (~7 miles)
  const roundedLng = Math.round(lng * 10) / 10;
  const sortedTypes = types.sort().join(',');
  return `places:${roundedLat}:${roundedLng}:${radius}:${sortedTypes}`;
}
```

---

## Phase 1: Type Definitions & Schema Extensions

### 1.1 Create Emergency Contact Types

**New File**: `src/types/emergency-contacts.ts`

```typescript
export type ContactType = 'personal' | 'professional' | 'agency' | 'community';
export type ContactCategory = 'medical' | 'government' | 'family' | 'community' | 'utility' | 'information';
export type ContactPriority = 'critical' | 'important' | 'helpful';
export type ContactSource = 'static' | 'ai' | 'google_places' | 'user_added';

export interface EmergencyContactRecommendation {
  id: string;
  name: string;
  type: ContactType;
  category: ContactCategory;
  phone: string;
  website?: string;
  email?: string;
  address?: string;

  // AI analysis fields (mirrors BundleRecommendation pattern)
  reasoning: string;
  relevantScenarios: string[];
  priority: ContactPriority;
  fitScore: number; // 0-100

  // Metadata
  region?: 'local' | 'state' | 'national';
  availability24hr?: boolean;
  source: ContactSource;
  placeId?: string;
  location?: { lat: number; lng: number };
  openingHours?: string;
}

export interface MeetingLocationRecommendation {
  id: string;
  name: string;
  address: string;
  description: string;
  placeId: string;
  location: { lat: number; lng: number };
  placeType: string;
  reasoning: string;
  scenarioSuitability: string[];
  priority: 'primary' | 'secondary' | 'tertiary';
  isPublic: boolean;
  hasParking: boolean;
  isAccessible: boolean;
  distanceFromHome?: number;
  estimatedTravelTime?: string;
}

export interface EmergencyContactsSection {
  contacts: EmergencyContactRecommendation[];
  meetingLocations: MeetingLocationRecommendation[];
  generatedAt: string;
  locationContext: string;
  googlePlacesUsed: boolean;
  aiAnalysisUsed: boolean;
}
```

### 1.2 Extend ReportDataV2

**Modify**: `src/types/mission-report.ts` (around line 193)

```typescript
export interface ReportSections {
  executiveSummary: string;
  riskAssessment: RiskIndicators;
  bundles: BundleRecommendation[];
  skills: SkillItem[];
  simulation: SimulationDay[];
  nextSteps: string[];
  emergencyContacts?: EmergencyContactsSection; // NEW - optional for backward compatibility
}
```

### 1.3 Update AI Configuration

**File 1**: `src/lib/ai/usage-logger.ts` (line ~28)
```typescript
export type AIFeature = ... | 'emergency_contacts';
```

**File 2**: `src/lib/ai/model-config.ts` (line ~74)
```typescript
emergency_contacts: {
  primary: MODELS.HAIKU,
  fallbacks: [MODELS.SONNET],
  temperature: 0.5,
  maxTokens: 2500,
},
```

---

## Phase 2: Google Places NearbySearch API

### 2.1 Emergency Services API Route

**New File**: `src/app/api/emergency-services/route.ts`

**Purpose**: Server-side endpoint for Google Places queries with caching

**Key Features**:
- Authentication required (logged-in user via Supabase)
- Query params: `lat`, `lng`, `radius`, `types`
- Database caching with 7-day TTL
- Automatic cache cleanup via triggers

**Supported Place Types**:
- Emergency: `hospital`, `police`, `fire_station`
- Support: `pharmacy`, `doctor`, `local_government_office`
- Meeting: `park`, `library`, `school`, `community_center`

**API Call Pattern**:
```
GET https://maps.googleapis.com/maps/api/place/nearbysearch/json
  ?location=30.2672,-97.7431
  &radius=16093  // 10 miles in meters
  &type=hospital|police|fire_station
  &key={NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY}
```

**Response Format**:
```typescript
{
  services: Array<{
    placeId: string;
    name: string;
    types: string[];
    address: string;
    phone?: string;
    location: { lat: number; lng: number };
    openNow?: boolean;
    rating?: number;
  }>;
  cached: boolean;
  cacheAge?: number; // minutes
}
```

**Error Handling**: Return empty array on failure (graceful degradation)

### 2.2 Google Places Helper

**New File**: `src/lib/google-places.ts`

```typescript
export async function fetchEmergencyServices(
  lat: number,
  lng: number,
  radius: number,
  types: string[]
): Promise<GooglePlaceResult[]> {
  // Validates coordinates (-90 to 90, -180 to 180)
  // Calls /api/emergency-services internally
  // Returns empty array on failure
}

export async function checkPlacesCache(cacheKey: string): Promise<GooglePlaceResult[] | null> {
  // Queries google_places_cache table
  // Returns null if expired or not found
  // Increments hit_count on cache hit
}

export async function savePlacesCache(
  cacheKey: string,
  results: GooglePlaceResult[]
): Promise<void> {
  // Saves to google_places_cache table
  // Sets expires_at to NOW() + 7 days
  // Triggers automatic cleanup
}
```

---

## Phase 3: Static Contact Library

### 3.1 Universal Contacts Module

**New File**: `src/lib/emergency-contacts/static-contacts.ts`

**Architecture**: Static contacts stored as **TypeScript constants** (not database)

**Benefits**:
- Zero database queries (faster)
- No data maintenance overhead
- Instant availability as fallback
- Version-controlled contact updates

**Functions**:

```typescript
export function getStaticContacts(country: string): EmergencyContactRecommendation[] {
  // Returns universal contacts based on country
  // US: 911, Poison Control (1-800-222-1222), FEMA, Red Cross, CDC, 988 Lifeline
  // Canada: 911, Canadian Red Cross
  // UK: 999, NHS 111
}

export function getRegionalContacts(state: string): EmergencyContactRecommendation[] {
  // Returns state-level emergency management contacts
  // Top 20 US states by population
  // Compiled from trusted government sources (.gov domains)
}

export function getAllStaticContacts(
  country: string,
  state?: string
): EmergencyContactRecommendation[] {
  // Combines universal + regional contacts
  // Deduplicates by phone number
}
```

**Data Structure Example**:
```typescript
const UNIVERSAL_CONTACTS_US: EmergencyContactRecommendation[] = [
  {
    id: 'us-911',
    name: 'Emergency Services (911)',
    type: 'agency',
    category: 'government',
    phone: '911',
    reasoning: 'Universal emergency number for police, fire, and medical emergencies',
    relevantScenarios: ['natural-disaster', 'civil-unrest', 'nuclear', 'emp-grid-down', 'pandemic'],
    priority: 'critical',
    fitScore: 100,
    region: 'national',
    availability24hr: true,
    source: 'static',
  },
  // ... more contacts
];
```

**Top 20 States to Include**:
1. California, 2. Texas, 3. Florida, 4. New York, 5. Pennsylvania
6. Illinois, 7. Ohio, 8. Georgia, 9. North Carolina, 10. Michigan
11. New Jersey, 12. Virginia, 13. Washington, 14. Arizona, 15. Massachusetts
16. Tennessee, 17. Indiana, 18. Missouri, 19. Maryland, 20. Wisconsin

---

## Phase 4: AI Contact Generation

### 4.1 Tier Variable System (Reusable)

**New File**: `src/lib/prompts/tier-variables.ts`

**Purpose**: Extensible tier-based prompt instructions for ALL features

```typescript
export type FeatureName =
  | 'emergency_contacts'
  | 'evacuation_routes'
  | 'bundle_recommendations'
  | 'simulation_depth'
  | 'skills_analysis';

export function getTierInstructions(feature: FeatureName, tier: string): string {
  const instructions: Record<FeatureName, Record<string, string>> = {
    emergency_contacts: {
      FREE: `From the provided contacts, select the 5 MOST CRITICAL emergency services.
Prioritize: 911, nearest hospital, poison control, nearest fire station, state emergency management.
Focus on life-saving resources only.`,

      BASIC: `Analyze all provided contacts and recommend 10-15 emergency services.
Include: Medical, fire, police, utilities, government resources.
Provide detailed reasoning for each recommendation.`,

      PRO: `Provide comprehensive emergency contact analysis (15-25 contacts).
Include: All standard services PLUS specialized resources (trauma centers, hazmat teams,
emergency shelters, HAM radio networks, community resources).
Include backup contacts and alternative resources.`,
    },

    evacuation_routes: {
      FREE: 'Generate 1 primary evacuation route.',
      BASIC: 'Generate 3 evacuation routes with alternatives.',
      PRO: 'Generate 5 evacuation routes with detailed alternatives and waypoint analysis.',
    },

    // Future features...
  };

  return instructions[feature]?.[tier] || instructions[feature]['FREE'];
}
```

**Usage in Prompts**:
```markdown
{{tier_instructions:emergency_contacts}}
```

### 4.2 Prompt Structure

**New Directory**: `prompts/emergency-contacts/`

**Files to Create**:
1. `system-prompt.md` - Emergency coordinator expertise, output requirements
2. `output-format.md` - Exact H2/H3 section structure for parsing
3. `location-mapping.md` - Urban/suburban/rural + climate zone considerations
4. `scenario-specific/natural-disaster.md`
5. `scenario-specific/emp-grid-down.md`
6. `scenario-specific/pandemic.md`
7. `scenario-specific/nuclear.md`
8. `scenario-specific/civil-unrest.md`
9. `scenario-specific/multi-year-sustainability.md`

**Output Format Example**:
```markdown
## Emergency Contacts Analysis

### Austin Emergency Medical Center
**Phone**: +1-512-555-1234
**Category**: medical
**Priority**: critical
**Reasoning**: Primary Level 1 trauma center within 5 miles, 24/7 emergency services
**Fit Score**: 95
**Relevant Scenarios**: natural-disaster, pandemic

## Meeting Locations

### Primary Meeting Location: Zilker Park
**Address**: 2100 Barton Springs Rd, Austin, TX 78746
**Reasoning**: Large open space, safe for earthquakes, elevated above flood zones
**Practical Details**: Free parking, ADA accessible, open 24/7
**Scenarios**: natural-disaster, civil-unrest
```

### 4.3 AI Generator Module

**New File**: `src/lib/ai/emergency-contacts-generator.ts`

```typescript
export async function generateEmergencyContacts(
  formData: WizardFormData,
  userId: string,
  userTier: string,
  googlePlacesResults?: GooglePlaceResult[]
): Promise<EmergencyContactsSection> {

  // Step 1: Get static contacts (universal + regional)
  const staticContacts = getAllStaticContacts(
    formData.location.country,
    formData.location.state
  );

  // Step 2: Combine with Google Places results
  const allContacts = [...staticContacts, ...googlePlacesResults];

  // Step 3: Build AI prompt with tier instructions
  const tierInstructions = getTierInstructions('emergency_contacts', userTier);
  const prompt = buildEmergencyContactsPrompt(formData, allContacts, tierInstructions);

  // Step 4: Call Claude Haiku API
  const response = await generateText({
    model: MODELS.HAIKU,
    prompt: prompt,
    temperature: 0.5,
    maxTokens: 2500,
  });

  // Step 5: Parse markdown response
  const parsedContacts = parseEmergencyContactsResponse(response.text);

  // Step 6: Log AI usage
  await logAIUsage({
    userId,
    feature: 'emergency_contacts',
    model: MODELS.HAIKU,
    tokensUsed: response.usage.totalTokens,
    duration: response.duration,
  });

  // Step 7: Return section
  return {
    contacts: parsedContacts.contacts,
    meetingLocations: parsedContacts.meetingLocations,
    generatedAt: new Date().toISOString(),
    locationContext: `${formData.location.city}, ${formData.location.state}`,
    googlePlacesUsed: googlePlacesResults.length > 0,
    aiAnalysisUsed: true,
  };
}
```

**Error Handling (Graceful Degradation)**:
- Google Places fails → Use static contacts only
- AI fails → Use static + Google Places without AI analysis
- Both fail → Static contacts only (always available)

**Parsing Strategy**:
- Split markdown by `## Emergency Contacts Analysis` and `## Meeting Locations`
- Find contact blocks by `###` headings
- Extract fields using regex: `**Phone**: (.+)`, `**Category**: (.+)`
- Validate required fields before adding to array
- Generate UUIDs for each contact and location

---

## Phase 5: Emergency Contacts Tab UI

### 5.1 Main Tab Component

**New File**: `src/components/plans/plan-details/EmergencyContactsTab.tsx`

**Props**:
```typescript
interface EmergencyContactsTabProps {
  contacts: EmergencyContactRecommendation[];
  meetingLocations: MeetingLocationRecommendation[];
  userTier: string;
  reportId: string;
  userEnrichments?: UserEnrichments;
}
```

**Key Features**:

1. **Tier Gating**:
   - FREE users: Show 5 sample contacts + upgrade prompt
   - Basic+ users: Show full contact list

2. **Category Filtering**:
   - Tabs: All, Medical, Government, Community, Utility, Information
   - Count badges on each tab

3. **Contact Cards**:
   - Priority badge (🔴 Critical, 🟡 Important, 🟢 Helpful)
   - Click-to-call phone links (`tel:` protocol)
   - Address with Google Maps link
   - Website link (opens in new tab)
   - 24/7 availability indicator (🕐)
   - AI reasoning tooltip (hover/click)
   - Scenario badges
   - Source indicator (Static/AI/Google Places)
   - Note button (opens note modal)

4. **Meeting Location Cards**:
   - Primary/secondary/tertiary badge
   - Full address with geocoded coordinates
   - "View on Map" button (opens Google Maps)
   - Practical details (🅿️ parking, ♿ accessibility, 📏 distance)

5. **Actions**:
   - "Add Family Member" button (all tiers)
   - "Add Custom Contact" button (all tiers)
   - "Export to Phone" (vCard generation, Basic+)
   - "Print Contact List" button (Basic+)

**Component Structure**:
```tsx
<EmergencyContactsTab>
  {userTier === 'FREE' ? (
    <>
      <ContactPreviewSection contacts={contacts.slice(0, 5)} />
      <FreeUserUpgradePrompt totalContactsAvailable={contacts.length} />
    </>
  ) : (
    <>
      <TabNavigation categories={...} />
      <FamilyMemberSection enrichments={userEnrichments} />
      <ContactGrid contacts={filteredContacts} />
      <MeetingLocationSection locations={meetingLocations} />
    </>
  )}
</EmergencyContactsTab>
```

### 5.2 Free User Upgrade Prompt

**Component**: `<FreeUserUpgradePrompt>` (inline in EmergencyContactsTab.tsx)

**Design**:
```tsx
<Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
  <Shield className="h-12 w-12 text-primary" />
  <h3>Unlock Full Emergency Contact List</h3>
  <p className="text-muted-foreground">
    You're viewing 5 of {totalAvailable} emergency contacts.
    Upgrade to see comprehensive local resources.
  </p>

  <div className="space-y-2">
    <CheckItem>Local hospitals, fire stations, and emergency services</CheckItem>
    <CheckItem>Scenario-specific contacts (medical, utilities, government)</CheckItem>
    <CheckItem>AI-recommended meeting locations with directions</CheckItem>
    <CheckItem>Export contacts to your phone</CheckItem>
  </div>

  <div className="flex gap-3">
    <Button variant="default" size="lg">
      Upgrade to Basic - $9.99/month
    </Button>
    <Button variant="outline">
      Learn More
    </Button>
  </div>
</Card>
```

### 5.3 Family Member Modal

**New File**: `src/components/plans/plan-details/FamilyMemberModal.tsx`

**Form Fields**:
- Name (text input)
- Relationship (select: Family Member, Friend, Friend's Family, Other)
- Typical Location (address input with Google Autocomplete)
- Phone Number (optional, international format)

**Actions**:
- Save → Updates `user_enrichments.familyMembers` via server action
- Cancel → Closes modal
- Delete (if editing existing) → Removes from array

**Server Action** (`src/app/actions/update-user-enrichments.ts`):
```typescript
export async function addFamilyMember(
  reportId: string,
  familyMember: FamilyMember
): Promise<{ success: boolean }> {
  // Validates user owns report
  // Appends to user_enrichments.familyMembers array
  // Revalidates plan details page
}
```

### 5.4 Notes Capability

**Implementation**:
- Add note icon button on each contact card
- Click opens popover with textarea
- Save stores in `user_enrichments.notes` with:
  - `sectionType: 'contact'`
  - `targetId: contactId`
  - `content: noteText`
  - `createdAt: timestamp`

**Display**:
- Notes appear as small badge/indicator on cards
- Hover/click to expand full note
- Edit/delete buttons for note management

---

## Phase 6: Integration with PlanDetailsTabs

### 6.1 Add Emergency Contacts Tab

**Modify**: `src/components/plans/plan-details/PlanDetailsTabs.tsx`

**Changes**:

1. Import icon:
```typescript
import { Shield } from 'lucide-react';
```

2. Update `TabId` type:
```typescript
type TabId = 'overview' | 'bundles' | 'contacts' | 'skills' | 'simulation' | 'map';
```

3. Add to `staticTabs` array (after bundles):
```typescript
const staticTabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'bundles', label: 'Bundles', icon: Package },
  { id: 'contacts', label: 'Emergency Contacts', icon: Shield }, // NEW
  { id: 'skills', label: 'Skills', icon: BookOpen },
  { id: 'simulation', label: 'Simulation', icon: Calendar },
  { id: 'map', label: 'Map & Routes', icon: Map },
];
```

4. Add tab content rendering:
```typescript
{activeTab === 'contacts' && (
  <EmergencyContactsTab
    contacts={reportData.sections.emergencyContacts?.contacts || []}
    meetingLocations={reportData.sections.emergencyContacts?.meetingLocations || []}
    userTier={userTier}
    reportId={reportId}
    userEnrichments={report.userEnrichments}
  />
)}
```

5. Pass user tier from page:
```typescript
// In [reportId]/page.tsx
const userTier = await getUserTier(); // Query from database
```

---

## Phase 7: Integration with Mission Generation

### 7.1 Modify Generation Flow

**Modify**: `src/app/api/generate-mission/route.ts`

**Add after bundle context generation** (around line 60):

```typescript
// Step 2.5: Get user tier for feature gating
const userTier = await getUserTier(user.id);

// Step 2.6: Generate emergency contacts (Basic+ only, limited for FREE)
let emergencyContactsSection: EmergencyContactsSection | undefined;

console.log('🚨 Generating emergency contacts...');

try {
  // Fetch from Google Places API
  const googlePlacesResults = await fetchEmergencyServices(
    formData.location.coordinates.lat,
    formData.location.coordinates.lng,
    16093, // 10 miles in meters
    ['hospital', 'police', 'fire_station', 'pharmacy', 'library', 'park']
  );

  console.log(`✅ Found ${googlePlacesResults.length} places from Google`);

  // Generate AI recommendations (tier-aware)
  emergencyContactsSection = await generateEmergencyContacts(
    formData,
    user.id,
    userTier,
    googlePlacesResults
  );

  console.log(`📞 Generated ${emergencyContactsSection.contacts.length} contacts`);
} catch (error) {
  console.error('❌ Emergency contacts generation failed:', error);
  // Graceful degradation: Use static contacts only
  emergencyContactsSection = {
    contacts: getStaticContacts(formData.location.country),
    meetingLocations: [],
    generatedAt: new Date().toISOString(),
    locationContext: `${formData.location.city}, ${formData.location.state}`,
    googlePlacesUsed: false,
    aiAnalysisUsed: false,
  };
}

// Later in save logic:
const reportData: ReportDataV2 = {
  // ... existing fields
  sections: {
    // ... existing sections
    emergencyContacts: emergencyContactsSection,
  },
};
```

### 7.2 User Tier Query Helper

**New Function** (add to existing tier helpers or create new file):

```typescript
// src/lib/queries/user-tier.ts
export async function getUserTier(userId: string): Promise<string> {
  const [profile] = await db
    .select({ tier: profiles.subscriptionTier })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile?.tier || 'FREE';
}
```

---

## Phase 8: Testing & Validation

### Manual Testing Checklist

- [ ] **Database Migrations**: Run `npm run db:generate` and `npm run db:migrate`
- [ ] **Cache Table**: Verify triggers work (insert, auto-cleanup, size limit)
- [ ] **FREE User Experience**:
  - [ ] Generate plan as FREE user
  - [ ] Verify 5 sample contacts displayed
  - [ ] Upgrade prompt appears with correct messaging
  - [ ] "This is 5 of X contacts" message accurate
- [ ] **BASIC User Experience**:
  - [ ] Generate plan as Basic user
  - [ ] Verify 10-15 contacts displayed
  - [ ] All categories populated correctly
  - [ ] Notes functionality works
- [ ] **PRO User Experience**:
  - [ ] Generate plan as Pro user
  - [ ] Verify 15-25 contacts with specialized resources
  - [ ] Meeting locations include 1-3 recommendations
- [ ] **Google Places Integration**:
  - [ ] Verify API returns hospitals/fire stations for test location
  - [ ] Check cache hit on second request (`cached: true`)
  - [ ] Test different locations (NYC vs rural Montana)
- [ ] **Static Contacts**:
  - [ ] 911 always included
  - [ ] State emergency management agency included
  - [ ] Phone numbers formatted correctly (+1 prefix)
- [ ] **Meeting Locations**:
  - [ ] 1-3 locations generated based on availability
  - [ ] Addresses are complete and geocoded
  - [ ] "View on Map" links work correctly
- [ ] **Family Members**:
  - [ ] Add family member modal opens
  - [ ] Address autocomplete works
  - [ ] Saves to user_enrichments successfully
  - [ ] Appears on map (future enhancement)
- [ ] **Notes**:
  - [ ] Add note to contact
  - [ ] Note persists after page refresh
  - [ ] Edit/delete note works
- [ ] **UI/UX**:
  - [ ] `tel:` phone links work on mobile
  - [ ] Dark mode rendering correct
  - [ ] Mobile responsive layout
  - [ ] Shield icon displays on tab
  - [ ] Category filtering works
- [ ] **Performance**:
  - [ ] Cache reduces API calls (monitor Google Cloud Console)
  - [ ] Page load time acceptable (<2s)
  - [ ] No N+1 query issues
- [ ] **Error Handling**:
  - [ ] Disable Google API → Static contacts only
  - [ ] Simulate AI failure → Static + Google without analysis
  - [ ] Invalid coordinates → Error message, fallback to static

### Cost Monitoring

After initial deployment:
- Monitor OpenRouter AI usage in `/admin/ai-usage` page
- Monitor Google Places API usage in Google Cloud Console
- Verify average cost stays under $0.02 per plan generation
- Check cache hit rate (should be ~70%)

---

## Critical Files Summary

### Database Migrations (3 migrations):
1. Add `user_enrichments` JSONB column to `mission_reports` table
2. Create `google_places_cache` table with indexes and triggers
3. Update Drizzle schema files

### New Files to Create (14 files):
1. `src/types/emergency-contacts.ts` - Type definitions
2. `src/db/schema/google-places-cache.ts` - Drizzle schema for cache table
3. `src/app/api/emergency-services/route.ts` - Google Places API endpoint
4. `src/lib/emergency-contacts/static-contacts.ts` - Universal contacts (TypeScript constants)
5. `src/lib/ai/emergency-contacts-generator.ts` - AI generation logic
6. `src/lib/google-places.ts` - API helper functions
7. `src/lib/prompts/tier-variables.ts` - Reusable tier instruction system
8. `src/components/plans/plan-details/EmergencyContactsTab.tsx` - Main UI component
9. `src/components/plans/plan-details/FamilyMemberModal.tsx` - Add family member dialog
10. `src/app/actions/update-user-enrichments.ts` - Server actions for enrichments
11. `prompts/emergency-contacts/system-prompt.md` - AI system prompt
12. `prompts/emergency-contacts/output-format.md` - Output structure
13. `prompts/emergency-contacts/location-mapping.md` - Urban/rural considerations
14. `prompts/emergency-contacts/scenario-specific/*.md` - 6 scenario-specific prompts

### Files to Modify (7 files):
1. `src/db/schema/mission-reports.ts` - Add `userEnrichments` field
2. `src/types/mission-report.ts` - Add `emergencyContacts` to ReportSections
3. `src/lib/ai/usage-logger.ts` - Add `emergency_contacts` feature type
4. `src/lib/ai/model-config.ts` - Add model configuration
5. `src/components/plans/plan-details/PlanDetailsTabs.tsx` - Add Emergency Contacts tab
6. `src/app/api/generate-mission/route.ts` - Integrate generation with tier check
7. `src/lib/queries/user-tier.ts` - Create or modify for getUserTier function

### Documentation Updates:
1. `ai_docs/tasks/032_report_annotations_enhancements.md` - Create roadmap for future features
2. `ai_docs/prep/roadmap.md` - Add annotation/enrichment feature to roadmap

---

## Implementation Approach

This implementation follows existing patterns from the codebase:
- **Type safety**: Full TypeScript types matching `BundleRecommendation` pattern
- **Graceful degradation**: Static contacts always available as fallback
- **Tier gating**: Server-side protection with database tier queries
- **AI generation**: Mirrors bundle generation flow with Haiku model
- **Tab integration**: Matches existing tab component structure (PlanDetailsTabs pattern)
- **Error handling**: Comprehensive try/catch with user-friendly messages
- **Data separation**: `formData` (generation inputs) vs `user_enrichments` (post-generation additions)
- **Caching**: Database-backed with automatic cleanup and size limits
- **Extensibility**: Tier variable system reusable across all features

**Estimated Development Time**: 4-5 days for complete implementation and testing

**Cost Analysis**:
- FREE users: ~$0.01375 per generation (5 contacts)
- BASIC users: ~$0.01375 per generation (10-15 contacts)
- PRO users: ~$0.01375 per generation (15-25 contacts)
- Break-even: 1 plan per month on $9.99 Basic plan
- Margin: 99.8% gross margin (infrastructure costs excluded)

---

## Security & Privacy

### Security Measures
- All API routes require logged-in user authentication
- Validate lat/lng ranges (-90 to 90, -180 to 180)
- Whitelist place types (prevent arbitrary queries)
- Sanitize markdown output for XSS
- Google API key server-side only (no client exposure)
- Rate limiting: 10 requests/min per user on `/api/emergency-services`
- Server-side tier checking (client tier cannot be trusted)

### Privacy Considerations
- No personal phone numbers stored
- Meeting locations are public places only
- Round coordinates to 0.1 degree in cache keys (no exact home address)
- GDPR/CCPA: Contacts included in data export, deleted with plan/account deletion
- No third-party sharing of contact data
- Family member locations stored encrypted in JSONB

### Error Handling
- Graceful degradation: Google fails → Static only, AI fails → Static + Google
- User-facing error: "Unable to fetch local services. Showing universal contacts."
- Logging: Full error details to monitoring system (Sentry/CloudWatch)

---

## Future Enhancements (Task 032)

Document in `ai_docs/tasks/032_report_annotations_enhancements.md`:

1. **Rich Text Annotations**
   - Markdown editor for notes
   - Code snippets, links, formatting

2. **Attachments & Photos**
   - Upload images to Supabase Storage
   - Attach PDFs, documents to contacts

3. **Collaborative Notes**
   - Shared plan annotations
   - Comment threads on contacts

4. **Note Categories & Tags**
   - Organize notes by category
   - Search and filter by tags

5. **Meeting Point Optimization**
   - Use family member locations to suggest optimal meeting points
   - Calculate equal-distance meeting spots
   - Consider traffic patterns and accessibility

6. **Custom Contact Categories**
   - User-defined categories
   - Custom fields per category

---

## Success Metrics

### User Engagement
- **Target**: 80% of Basic+ users view Emergency Contacts tab
- **Measure**: Tab click-through rate in analytics

### Feature Value
- **Target**: 90%+ of contacts relevant to scenarios
- **Measure**: User feedback surveys, contact usage tracking

### Cost Efficiency
- **Target**: <$0.02 per plan generation
- **Measure**: OpenRouter and Google Cloud billing

### Upgrade Conversion
- **Target**: 5% of FREE users upgrade after seeing feature
- **Measure**: Conversion tracking from upgrade prompt

---

## Deployment Checklist

### Pre-Deployment
- [ ] Verify `NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY` in production env
- [ ] Enable Places API in Google Cloud Console
- [ ] Set billing alert at $50/month in Google Cloud
- [ ] Run database migrations on production database
- [ ] Verify triggers work correctly in production
- [ ] Run linting and type-checking (`npm run lint`, `npx tsc --noEmit`)
- [ ] Test on staging environment

### Post-Deployment (Monitor for 24 hours)
- [ ] Check error logs for API failures
- [ ] Monitor OpenRouter AI usage (target: <$2/day)
- [ ] Monitor Google Places API usage (target: <$1/day with caching)
- [ ] Track user engagement (tab clicks)
- [ ] Verify cache hit rate (target: ~70%)
- [ ] Check upgrade conversion rate
- [ ] Monitor database table sizes (cache table should not exceed 10K rows)

### Optional Feature Flag
- Add `emergency_contacts_enabled` flag in feature flags system
- Enable for 10% of Basic+ users initially
- Monitor costs and performance
- Roll out to 100% after 1 week

---

**Last Updated**: 2025-12-15
**Task Status**: Ready for Implementation
**Dependencies**: Task 030 completion not required (independent feature)
