# Seiyalaam (செய்வோம்) 🌿⚡

> **Tamil-English Circular Hardware & E-Waste Upcycling Platform**

---

## What is Seiyalaam?

**Seiyalaam** ("Let's make it" in Tamil) is an open-access e-waste reverse-engineering and circular hardware platform. It empowers makers, students, and engineers to safely extract functional components from obsolete consumer electronics (such as discarded printers, laptops, and microwave ovens) and automatically matches them to curated DIY blueprints. By combining deterministic parts-matching with safety hazard classification and bilingual instructions, Seiyalaam diverts toxic silicon and rare-earth metals from landfills while eliminating prototype costs for creators.

---

## Problem

- **Accelerating E-Waste Crisis**: Over 1.7 million tonnes of electronic waste are generated annually in India alone, with more than 90% processed informally via hazardous open burning and acid leaching.
- **Resource Wastage**: High-quality stepper motors, precision optical encoders, Li-ion 18650 cells, and power semiconductors are dumped into landfills simply because one peripheral chip or plastic gear in an appliance failed.
- **Cost & Language Barrier**: Polytechnic students and rural grassroots innovators often cannot afford expensive new robotics or IoT modules and lack access to hardware documentation available in their native tongue (Tamil).

---

## Features

### 1. Reverse-Engineering & Teardown Safety Engine
- **Class A to E Hazard Classification**: Interactive safety assessment checklists diagnose devices before teardown, providing protocols for high-voltage CRT flybacks, microwave magnetrons, and lithium-ion cells.
- **12+ Device Disassembly Guides**: Step-by-step salvage checklists for printers, microwave ovens, laptops, DVD players, PC power supplies, and CRT monitors.

### 2. Autonomous Component Matching & Feasibility Scoring
- **Deterministic Feasibility Engine**: Computes exact percentage feasibility scores (0% to 100%) against 20+ verified maker blueprints based on your logged scrap inventory.
- **"One-Away" Missing Link Finder**: Identifies the single missing component (e.g., a ₹15 potentiometer or relay) that unlocks the maximum number of feasible projects.
- **Substitute Component Logic**: Dynamically considers alternative parts (e.g., IR sensors for ultrasonic probes, plain LED strips for addressable WS2812).

### 3. Circular Impact & Ecological Telemetry
- **Live Landfill Offset Tracking**: Real-time conversion of salvaged hardware weight into kilograms of e-waste diverted and CO₂ greenhouse gas emissions prevented.
- **Maker Economy Metrics**: Calculates financial savings achieved by scavenging scrap silicon instead of purchasing commercial modules.

### 4. Interactive Reverse-Engineering Simulator & Playground
- **Live Teardown Simulator**: Interactive hero widget demonstrating X-ray electronic scanning, automated component extraction, and instant blueprint compilation.
- **Scrap Playground**: Instant tap-and-match sandbox allowing makers to test build feasibility for household scrap without signing up first.

### 5. Multimodal AI Assistance & Vernacular First
- **Smart Component Input**: Natural language text parser and Gemini-powered visual component classification.
- **Full Tamil-English Bilingual Support**: Seamless language toggle supporting Noto Sans Tamil typography for grassroots makers across Tamil Nadu.

---

## Tech Stack

### Frontend
- **React 19** – UI component library
- **TypeScript 5.x** – Strict, strongly-typed domain models
- **Vite 8** – Lightning-fast module bundler & HMR
- **Tailwind CSS 4** – Modern responsive design system
- **Lucide React** – Accessible iconography
- **HTML5 Canvas** – Interactive conductive circuit-trace visualization

### Backend & Data Layer
- **Supabase** – Backend-as-a-Service (Auth, Database, Storage)
- **PostgreSQL 15+** – Relational database with strict Row Level Security (RLS)
- **Google Gemini API** – Multimodal hardware vision & text parsing

### Testing & Code Quality
- **Vitest 5** – Fast unit & integration test runner
- **React Testing Library & Jest DOM** – Accessible component testing
- **Oxlint** – High-speed Rust-based JavaScript/TypeScript linter

---

## Architecture

```
User (Browser / Mobile)
        │
        ▼
   React 19 SPA (Vite + Tailwind CSS)
   ├── Routing (React Router v7)
   ├── Contexts (AuthContext, LanguageContext)
   ├── Hooks (useInventory, useAuth, useLanguage)
   └── Services (inventoryService, authService)
        │
        ├── [Public Anon Key Only]
        ▼
  Supabase Cloud (BaaS)
   ├── Auth (Email/Password, JWT Sessions)
   ├── PostgreSQL Database (Profiles, Inventory, Devices, Projects)
   │     └── Row Level Security (RLS: auth.uid() enforcement)
   └── Storage (listing-photos)
```

---

## Installation

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- A free **Supabase** project (optional for guest mode, required for cloud sync)

### Setup Commands
```bash
# Clone the repository
git clone https://github.com/deepikavijay56-max/Seiyalaam.git
cd Seiyalaam

# Install dependencies
npm install
```

---

## Environment Variables

Copy the example environment template:

```bash
cp .env.example .env.local
```

Fill in your configuration details in `.env.local`:

```env
# Supabase Configuration (Client-safe anon key only)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Google Gemini API Key for AI hardware vision features
VITE_GEMINI_API_KEY=your-gemini-api-key
```

> **Security Note**: Never commit service-role keys or database passwords to client-side code. The application strictly communicates using the Supabase public anon key with Row Level Security enforced on PostgreSQL tables.

---

## Development

To start the local development server:

```bash
npm run dev
```

The application will be running at [http://localhost:5173/](http://localhost:5173/).

---

## Testing & Quality Verification

Run the full automated verification suite:

```bash
# Typecheck TypeScript files
npm run typecheck

# Run Oxlint code quality checks
npm run lint

# Run Vitest unit & integration tests
npm run test

# Run tests with coverage report
npm run test:coverage

# Build production bundle
npm run build
```

---

## Deployment (Vercel)

The repository includes a production-ready `vercel.json` with Single Page Application (SPA) rewrite rules and asset caching.

### Deploy with Vercel CLI
```bash
# Install Vercel CLI globally if not already installed
npm i -g vercel

# Link and deploy
vercel
```

### Environment Variables on Vercel
In the Vercel Project Dashboard (`Settings` -> `Environment Variables`), configure:
1. `VITE_SUPABASE_URL`
2. `VITE_SUPABASE_ANON_KEY`
3. `VITE_GEMINI_API_KEY` (optional)

---

## Security

- **Row Level Security (RLS)**: Every user table (`inventory_items`, `owned_devices`, `teardowns`, `profiles`, `listings`, `requests`) enforces strict RLS policies in PostgreSQL where `auth.uid() = user_id`.
- **Privilege Escalation Protection**: Users cannot update their own role column in the `profiles` table.
- **Client Sanitization**: All data writes are validated both client-side and enforced at the PostgreSQL constraint level.
- **Zero Exposed Secrets**: No server secrets or private keys are bundled into frontend assets.

---

## Roadmap

- [ ] **Community P2P Component Exchange**: Enable makers in the same district/city to swap scavenged parts with privacy-preserving requests.
- [ ] **Offline PWA Support**: Full Progressive Web App caching for polytechnic workshops with intermittent internet access.
- [ ] **Expanded Vernacular Guides**: Additional audio step-by-step walkthroughs in Tamil.
- [ ] **Automated PCB Pinout Vision**: On-device TensorFlow.js / Gemini vision model for instant IC marking recognition.

---

## License

This project is licensed under the MIT License - built for the planet and sustainable hardware education 🌿.
