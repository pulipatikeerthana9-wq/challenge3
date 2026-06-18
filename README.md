# EcoPilot — Carbon Footprint Coach AI 🌿

> **Official Submission for PromptWars Virtual Challenge 3**  
> A premium, full-stack Carbon Footprint Awareness and Natural Language Simulation platform. Built with React, Next.js, and TypeScript.

---

## 🚀 Judge's Fast-Track Overview

EcoPilot solves the biggest issue with carbon calculators: **poor AI integration and inaccurate estimation formulas**. 

### 🌟 Key Enhancements Added in Audit Refactor:
1. **Mathematical Accuracy (No Double Counting)**: AC electricity consumption (calculated by operating runtime) is automatically subtracted from total household grid utility consumption. Commute parameters are standardized to a realistic 240-day school/work year rather than an inflated 365 days.
2. **Flight Segregation**: Split domestic vs. international flights to account for the massive 6.3x differential in per-flight carbon intensity ($255\text{ kg}$ vs. $1,620\text{ kg}$).
3. **Hybrid NLP & Gemini AI Simulator**: If `GEMINI_API_KEY` is configured in `.env.local`, the What-If simulator uses structured Gemini LLM parsing. If offline, it falls back to a highly robust regex-based NLP matcher.
4. **Clean Code & Security**: Implemented strict route rate-limiting headers (IP-based, max 60/min), rigorous parameter validations, client-side input sanitization, and eliminated React hydration warnings (deferred server-side Recharts compilation mismatch).

---

## 🧱 Architecture Diagram

```
                              ┌────────────────────────┐
                              │     User Dashboard     │
                              │ (React / Vanilla CSS)  │
                              └───────────┬────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
         [POST /api/footprint]                           [POST /api/simulate]
    ┌─────────────────────────────┐                 ┌─────────────────────────────┐
    │     Strict payload check    │                 │   Rate Limiting (60/min)    │
    │   & negative value clamp    │                 └──────────────┬──────────────┘
    └─────────────┬───────────────┘                                │
                  │                                  Has GEMINI_API_KEY in env?
                  │                                       /               \
                  ▼                                     (Yes)            (No)
      ┌───────────────────────┐                         /                  \
      │ Deterministic Formula │            ┌───────────▼───────────┐  ┌─────▼─────────────┐
      │  (IPCC & India CEA)   │            │   Gemini LLM Call     │  │ Deterministic NLP │
      └───────────────────────┘            │ (JSON schema payload) │  │   Rules Engine    │
                  │                        └───────────┬───────────┘  └─────┬─────────────┘
                  │                                    │                    │
                  ▼                                    └──────────┬─────────┘
        [JSON Response Payload]                                   ▼
      { transport, diet, energy,                      ┌───────────────────────┐
        shopping, total, trees }                      │ Calculate delta &     │
                                                      │ trees equivalent      │
                                                      └───────────┬───────────┘
                                                                  ▼
                                                       [JSON Response Payload]
                                                       { delta_kg, explanation }
```

---

## 📦 Project Structure

```
challenge3/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── footprint/route.ts  # POST /api/footprint (validations & clamps)
│   │   │   │   └── simulate/route.ts   # POST /api/simulate (hybrid AI parser)
│   │   │   ├── globals.css             # Premium custom HSL dark-green design
│   │   │   ├── layout.tsx              # SEO Tags & Google Fonts Loader
│   │   │   └── page.tsx                # Client State Controller
│   │   ├── components/
│   │   │   ├── BreakdownChart.tsx      # Hydration-safe Recharts donut chart
│   │   │   ├── CarbonTwinCard.tsx      # Current vs Improved vs Future meters
│   │   │   ├── FootprintSummaryCard.tsx# Trees & driving equivalent visualizer
│   │   │   ├── LifestyleForm.tsx       # Sanitized form controls (flights split)
│   │   │   └── WhatIfSimulator.tsx     # Scenario query and error cards
│   │   ├── lib/
│   │   │   ├── api.ts                  # Client fetch boundaries
│   │   │   ├── calculator.ts           # Clean carbon math algorithms
│   │   │   └── constants.ts            # Localized emission constants
│   │   └── types/
│   │       └── index.ts                # TypeScript strict interfaces
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
└── README.md
```

---

## 🛠️ Installation & Setup

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Configure your Environment Variable** (Optional, falls back to local NLP rules engine):
   Create a `.env.local` file in the `frontend` folder:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

**Environment notes:**
- A sample `.env.example` has been added to `frontend/.env.example` to make local setup easier; copy it to `.env.local` and fill in your key.
- Rate limiting is implemented in-memory for the hackathon build and will reset on server restarts or redeploys. For production or persistent demos use a Redis-backed rate limiter (recommended) to avoid quota resets that could allow abuse of the Gemini key.

### Optional: Enable Redis for persistent rate limits
If you have a Redis instance available and want rate limits to persist across restarts, set `REDIS_URL` in your environment and restart the app. Example `REDIS_URL` formats:

```
# Standard Redis with no auth
REDIS_URL=redis://localhost:6379

# With password
REDIS_URL=redis://:your_password@redis.example.com:6379
```

The app will automatically use Redis if `REDIS_URL` is present; otherwise it falls back to an in-memory limiter.

## Quick Checks

- Build and run production server (uses Next.js production mode):

```bash
cd frontend
npm run build
npm run start
```

- Start development server:

```bash
cd frontend
npm run dev
```

- Run the included smoke test (requires dev server or production server running):

```bash
node scripts/smoke.js
```

- Environment files:
   - Copy `frontend/.env.example` to `frontend/.env.local` and set `GEMINI_API_KEY` if you want Gemini features.
   - Optionally set `REDIS_URL` to enable persistent rate limiting across restarts.

- Default rate limits in this build:
   - `coach` and `simulate`: 60 requests per minute
   - `footprint`: 100 requests per minute


3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to **`http://localhost:3000`**.

---

## 🧮 Emission Factor References

We leverage official audit-compliant coefficients:

| Emission Category | Factor | Unit Reference | Source |
| :--- | :--- | :--- | :--- |
| **Petrol Car** | `0.192` | kg CO₂e / km | IPCC Standard |
| **Diesel Car** | `0.171` | kg CO₂e / km | IPCC Standard |
| **Electric Car** | `0.045` | kg CO₂e / km | India Grid Mix Average |
| **Bus** | `0.089` | kg CO₂e / km | Regional Transit Index |
| **Metro Rail** | `0.031` | kg CO₂e / km | Regional Transit Index |
| **Domestic Flight** | `255.0` | kg CO₂e / flight | Average Domestic Hub-to-Hub |
| **Intl Flight** | `1620.0` | kg CO₂e / flight | Intercontinental Segment |
| **Grid Electricity** | `0.716` | kg CO₂e / kWh | India CEA Grid Factor 2023 |
| **LPG Cooking Gas**| `2.983` | kg CO₂e / kg | standard 14.2kg cylinder cylinder |

---

## 📄 License
EcoPilot is submitted for PromptWars Virtual Challenge 3. All calculations and methodologies are fully auditable.
