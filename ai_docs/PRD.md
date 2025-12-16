# Emergency Planner - Product Requirements Document (PRD)

## 1. Overview
Emergency Planner is a comprehensive web application designed to help individuals and families prepare for various emergency scenarios. It combines AI-driven planning, curated educational resources, and an e-commerce platform to provide a holistic preparedness solution. Users can generate personalized survival kits, simulate emergency scenarios, plan evacuation routes, and purchase necessary equipment.

## 2. Functionality

### 2.1 Core Features
*   **AI-Powered Planner**: 
    *   Users input parameters: Location, Family Size, Scenario Type (e.g., Natural Disaster, Civil Unrest, EMP), Mobility (Bug In/Out), and Budget.
    *   AI generates a detailed `GeneratedKit` containing:
        *   **Executive Summary**: Overview of the strategy.
        *   **Readiness Score**: 0-100 assessment.
        *   **Simulation Log**: A narrative day-by-day breakdown (Day 0-3) of what to expect.
        *   **Kit Items**: Prioritized list of gear (Essentials, Medical, Defense, etc.) with cost estimates.
        *   **Ration Plan**: Calculations for water and food requirements.
        *   **Required Skills**: List of skills needed to survive the scenario.
    *   **Skill Resources**: Curated YouTube videos, articles, and PDFs for learning required skills.
    *   **Evacuation Routes**: AI-suggested routes with waypoints and risk assessments (High/Medium/Low).

*   **User Dashboard**:
    *   View and manage saved scenarios (`Saved Scenarios`).
    *   Track preparedness level.
    *   Update user profile (Location, Family Size).

*   **E-Commerce Store**:
    *   **Direct Sales**: "House Kits" sold directly by the platform.
    *   **Affiliate Integration**: Links to external products (e.g., Amazon) for specific items.
    *   Product categorization, pricing, and ratings.

*   **Authentication & Profiles**:
    *   Secure login/signup via Supabase Auth.
    *   Profile management (Name, Birth Year).
    *   Role-based access (USER vs. ADMIN).

*   **Admin Panel**:
    *   Product management (CRUD operations for Store items).

## 3. Technical Implementation

### 3.1 Tech Stack
*   **Frontend Framework**: Next.js 16 (App Router)
*   **Language**: TypeScript
*   **UI Library**: React 19
*   **Styling**: Tailwind CSS 4
*   **Icons**: Lucide React
*   **Database & Auth**: Supabase (PostgreSQL)
*   **AI Integration**: 
    *   Vercel AI SDK (`ai`)
    *   Google GenAI (`@google/genai`, `@ai-sdk/google`)
*   **Maps**: 
    *   Leaflet / React Leaflet (OpenSource maps)
    *   Google Maps API (Alternative/Hybrid approach)
*   **Charts**: Recharts (for data visualization)
*   **Validation**: Zod

### 3.2 Key Libraries
*   `@supabase/supabase-js`: Client for Supabase interaction.
*   `react-leaflet`: Map rendering.
*   `zod`: Schema validation for API inputs and AI generation.
*   `lucide-react`: Iconography.

## 4. Architecture

### 4.1 High-Level Architecture
The application follows a modern serverless architecture using Next.js and Supabase.

*   **Client Layer**: React components for UI. Uses Context API for global state where necessary (e.g., user session).
*   **Server Layer**: 
    *   **Server Actions**: Handle sensitive logic like database mutations and AI API calls directly from React components.
    *   **API Routes**: (If used) Standard REST endpoints for external integrations.
*   **Data Layer**: Supabase provides:
    *   **PostgreSQL Database**: Relational data storage.
    *   **Auth**: User identity management.
    *   **Row Level Security (RLS)**: Enforces data access rules at the database level.
*   **AI Layer**: Wrappers around LLMs (Google Gemini via Vercel AI SDK) to generate structured JSON responses for planner outputs.

## 5. Data Schema

### 5.1 Database Tables (Supabase)

#### `profiles`
*   `id` (UUID, PK): References `auth.users`.
*   `role` (Text): 'USER' | 'ADMIN'.
*   `full_name`, `first_name`, `last_name`, `birth_year`, `email`.
*   *Security*: Users can only view/edit their own profile.

#### `products`
*   `id` (UUID, PK)
*   `name` (Text)
*   `price` (Numeric)
*   `type` (Text): 'HOUSE_KIT' | 'AFFILIATE'
*   `category`, `description`, `image`, `rating`, `affiliate_link`.
*   *Security*: Public read. Admin only write/update/delete.

#### `saved_scenarios`
*   `id` (UUID, PK)
*   `user_id` (UUID, FK): References `auth.users`.
*   `scenario_type` (Text): e.g., 'NATURAL_DISASTER'.
*   `location` (Text)
*   `data` (JSONB): Stores the full `GeneratedKit` object.
*   `created_at`, `updated_at`.
*   *Security*: Users can only access their own scenarios.

### 5.2 JSON Structures (TypeScript Interfaces)

#### `GeneratedKit` (stored in `saved_scenarios.data`)
```typescript
interface GeneratedKit {
  scenarios: string[];
  summary: string;
  readinessScore: number;
  simulationLog: string; // Narrative text
  rationPlan: string;
  items: KitItem[];
  requiredSkills: string[];
  youtubeQueries: string[];
  evacuationRoutes: Route[];
  skillResources?: SkillResource[];
}
```

#### `KitItem`
```typescript
interface KitItem {
  id: string;
  name: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedCost: number;
  type: 'AFFILIATE' | 'DIRECT_SALE' | 'OWNED';
  owned: boolean;
}
```

#### `Route`
```typescript
interface Route {
  id: string;
  name: string;
  description: string;
  waypoints: { lat: number; lng: number; name: string }[];
  dangerLevel: 'High' | 'Medium' | 'Low';
}
```

## 6. Future Improvement Ideas

1.  **Community Features**:
    *   Share scenarios and plans with other users.
    *   Community ratings/reviews for specific items or plans.
2.  **Inventory Management**:
    *   Allow users to mark items as "Owned" in their digital inventory.
    *   Expiration tracking for perishable goods (food, water, meds).
3.  **Real-Time Alerts**:
    *   Integrate weather or news APIs to alert users if a saved scenario type is becoming likely in their location.
4.  **Offline Mode**:
    *   PWA support to access saved plans and guides without internet connection (crucial for emergencies).
5.  **PDF Export**:
    *   Generate a printable PDF of the entire emergency plan (checklist, routes, ration plan).
6.  **Map Enhancements**:
    *   Offline map caching.
    *   Integration with live traffic or hazard data layers.
7.  **Subscription Model**:
    *   Premium tier for advanced AI models, unlimited saved scenarios, or exclusive "House Kits".

