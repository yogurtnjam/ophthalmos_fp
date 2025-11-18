# Overview

OPHTHALMOS is a color vision deficiency (CVD) adaptive UI research application. It tests users' cone sensitivity through interactive assessments, allows customization of RGB hue adjustments, and compares performance on visual tasks between custom adaptive filters and OS-level preset filters (protanopia, deuteranopia, tritanopia, grayscale). The application collects quantitative metrics (time, accuracy, interactions) to evaluate the effectiveness of personalized color adaptation strategies.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, built using Vite for development and bundling.

**Routing**: Wouter-based client-side routing with multi-page flow:
- Questionnaire → Cone Test → CVD Results (RGB adjustment) → Task Games → Statistics

**UI Components**: shadcn/ui component library (Radix UI primitives) with Tailwind CSS for styling. Custom design system follows modern minimal aesthetic inspired by Linear/Vercel with neutral color palette and CSS variables for theming.

**State Management**: React Context API (`AppContext`) manages global application state including:
- Session data (questionnaire responses, cone test results, RGB adjustments)
- Task performance metrics (time, swipes, clicks, accuracy)
- Current filter mode selection (custom vs. OS presets)
- Navigation/step tracking

**Data Fetching**: TanStack Query (React Query) for server state management with custom `apiRequest` wrapper for API calls.

**Color Processing**: Custom color utility functions for:
- Hex/RGB/HSL conversions
- Contrast ratio calculations (WCAG compliance)
- Adaptive cone-based color transformations
- OS preset filter simulations (protanopia, deuteranopia, tritanopia, grayscale)

## Backend Architecture

**Runtime**: Node.js with Express server, TypeScript compiled via esbuild.

**API Design**: RESTful endpoints following resource-oriented patterns:
- `POST /api/sessions` - Create session with questionnaire data
- `GET /api/sessions/:id` - Retrieve session
- `PUT /api/sessions/:id/cone-test` - Update cone test results
- `PUT /api/sessions/:id/rgb-adjustment` - Update RGB adjustments
- `POST /api/sessions/:id/tasks` - Record task performance

**Data Validation**: Zod schemas in `shared/schema.ts` for runtime type validation and serialization between client/server.

**Storage Strategy**: In-memory storage (`MemStorage` class) with interface (`IStorage`) designed for easy swap to persistent database (Postgres with Drizzle ORM configuration present but not actively used).

**Development Features**: Vite middleware integration for HMR, custom logging middleware for API request tracking.

## Data Architecture

**Schema Definitions** (shared between client/server):

1. **Questionnaire**: User demographics (name, age, CVD type, screen time)
2. **ConeTestResult**: L/M/S cone sensitivity values (0-1) and detected deficiency type
3. **RGBAdjustment**: Custom hue rotation values for red/green/blue channels (0-360°)
4. **TaskPerformance**: Metrics for each task attempt (taskId, filterType, time, interactions, accuracy)
5. **SessionData**: Complete user session containing all above data structures

**Data Flow**: Questionnaire → Cone Test → RGB Adjustment → Task Performance Collection → Statistical Analysis

## External Dependencies

**UI Framework**:
- React 18.3+ for component architecture
- Wouter for lightweight routing
- shadcn/ui component library (23+ Radix UI components)

**Styling**:
- Tailwind CSS with custom design tokens
- CSS variables for theme customization
- PostCSS for processing

**Data Management**:
- TanStack Query for async state management
- Zod for schema validation
- React Hook Form with Zod resolvers for form handling

**Development Tools**:
- Vite for build tooling and dev server
- TypeScript for type safety
- tsx for server-side TypeScript execution

**Database (Configured but not active)**:
- Drizzle ORM with PostgreSQL dialect
- Neon serverless driver for Postgres
- Migration support via drizzle-kit

**Replit Integration**:
- Custom Vite plugins for Replit environment (cartographer, dev banner, runtime error overlay)
- Configured for seamless deployment on Replit platform

**Color Science & Psychophysics**:
- Custom implementations of colorimetric transformations
- Heuristic-based cone adaptation algorithms
- WCAG contrast ratio calculations
- Staircase threshold calculator for adaptive psychophysical testing
  - Reversal detection algorithm
  - Threshold estimation from fixed-level test data
  - Psychometric function analysis

**Note**: The application uses an in-memory storage implementation for rapid prototyping. Database configuration (Drizzle + Postgres) is present for future migration to persistent storage when needed.

## Recent Updates (November 15, 2025)

**Cone Test Improvements:**
- Simplified from adaptive staircase to fixed contrast levels: [1%, 5%, 10%, 25%, 50%, 100%]
- Reduced total trials from 60 to 18 (6 per color × 3 colors)
- Test completion time: ~5 minutes
- Smaller Landolt C design (radius 30, stroke 12)
- All 4 tick marks now visible with gap alignment at each rotation
- Removed fixation cross from test panel

**Threshold Calculator Implementation:**
- Added `client/src/lib/staircaseThreshold.ts` with TypeScript implementation
- Functions:
  - `thresholdFromReversals()` - Analyzes adaptive staircase sequences
  - `thresholdFromFixedLevels()` - Calculates thresholds from fixed-level test data
  - Reversal point detection with direction change tracking
- New demo page at `/staircase-demo` for testing and visualization
- Integrated into ConeTest results calculation for more accurate threshold estimation
- Replaces simple averaging with psychometric analysis (geometric mean between highest incorrect and lowest correct levels)