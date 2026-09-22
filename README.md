# RehabSense — Camera-Assisted Home Rehabilitation Coach
> **"Your Recovery. Your Camera. Your Care Team."**  
> **Team**: TechHives  
> **Problem Statement**: PS 05 — Camera-Assisted Home Rehabilitation Coach  
> **Version**: 1.0.0 (Hackathon-Grade Product Prototype)

---

## ⚡ Quickstart: Run Everything in 1 Command

To launch both the **FastAPI Backend** and the **Next.js Web Frontend** simultaneously:

```bash
./scripts/run-dev.sh
```

Once running:
- 🌐 **Web Application**: [http://localhost:3000](http://localhost:3000)
- 🎯 **Judge Demo Hub (1-Click Switcher)**: [http://localhost:3000/demo](http://localhost:3000/demo)
- 📚 **Backend Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧪 One-Command Automated Verification

To run the complete automated test suite across the Computer Vision math, FastAPI backend endpoints, MongoDB seed, and Next.js frontend compilation:

```bash
./scripts/verify-all.sh
```

### Expected Output:
```text
==========================================================
    REHABSENSE — COMPREHENSIVE VERIFICATION SUITE       
    Problem Statement 05 | Team TechHives                 
==========================================================

🔍 [1/3] Testing Computer Vision & Exercise Engine Math...
✓ Angle calculations passed perfectly!
   ✅ Exercise Engine angle calculations & vector geometry verified!

🔍 [2/3] Testing Backend API Endpoints & Database Integration...
   • Health Check: OK (mongodb / in-memory-fallback)
   • Patient Auth: OK (patient@rehabsense.demo)
   • Patient Dashboard: OK (Good evening, Aarav)
   • Patient Progress: OK (10 historical sessions)
   • Therapist Auth: OK (therapist@rehabsense.demo)
   • Therapist Census: OK (1 flagged session pending)
   • Clinician Override: OK (Target updated to 110°)
   • Prescription Live Update: OK (110° confirmed in patient record)
   ✅ Backend API and clinical workflows verified!

🔍 [3/3] Testing Web Frontend Build & Type Validity...
   ✅ All 11 Next.js routes built and compiled cleanly!

==========================================================
    🎉 ALL SYSTEM CHECKS PASSED: 100% OPERATIONAL!       
==========================================================
```

---

## 🛠️ Step-by-Step Manual Setup

If you prefer to start each service in separate terminal windows:

### Terminal 1: Backend API (FastAPI)
```bash
# 1. Install dependencies
python3 -m pip install -r apps/api/requirements.txt

# 2. Seed database with demo accounts, 10 sessions, and prescriptions
python3 apps/api/seed.py

# 3. Start API server on port 8000
cd apps/api && python3 -m uvicorn main:app --reload --port 8000
```

### Terminal 2: Frontend Web (Next.js)
```bash
# 1. Install dependencies
cd apps/web && npm install

# 2. Start Next.js development server on port 3000
npm run dev
```

---

## 🔍 How to Verify the Backend is Working

### 1. Health Check
Run this curl command in your terminal:
```bash
curl http://localhost:8000/health
```
**Expected Response**:
```json
{
  "status": "healthy",
  "storage": "mongodb"
}
```
*(Note: If MongoDB is offline, RehabSense transparently engages its high-performance in-memory fallback store and returns `"storage": "in-memory-fallback"` with zero downtime).*

### 2. Interactive Swagger Documentation
Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser. You will see interactive documentation for all endpoints:
- `POST /api/auth/demo-switch`: 1-click instant login for Patient or Therapist
- `GET /api/patients/me/dashboard`: Patient dashboard with plan & streak
- `GET /api/patients/me/progress`: 10-session historical timeline
- `POST /api/sessions`: Ingestion of structured telemetry metrics
- `GET /api/therapist/dashboard`: Census overview and flagged session list
- `POST /api/therapist/sessions/{id}/review`: Clinician override and prescription updates
- `POST /api/demo/reset`: Instant demo database reset

### 3. Test Patient Login via CLI
```bash
curl -X POST http://localhost:8000/api/auth/demo-switch \
  -H "Content-Type: application/json" \
  -d '{"role": "PATIENT"}'
```
Returns an access token for **Aarav Mehta** (`patient@rehabsense.demo`).

---

## 🖥️ How to Verify the Frontend is Working

Open [http://localhost:3000](http://localhost:3000) and verify these key screens:

| Route | Screen Name | What to Check / Verify |
| :--- | :--- | :--- |
| **`/`** | **Landing Page** | • Interactive hero mockup with pose skeleton & live angle tag.<br>• 6-step workflow (Capture $\to$ Detect $\to$ Analyze $\to$ Validate $\to$ Feedback $\to$ Review).<br>• Direct CTA buttons for Patient & Therapist demos. |
| **`/demo`** | **Judge Demo Hub** | • 1-click role switcher cards for Aarav Mehta and Dr. Ananya Sharma.<br>• **"Reset Demo"** button to restore clean baseline.<br>• 3-minute live presentation guide with jump links. |
| **`/patient/dashboard`** | **Patient Dashboard** | • Greeting: *"Good evening, Aarav"*.<br>• 6-day streak and +18% ROM trend badge.<br>• Assigned Rehab: *Elbow Flexion & Extension* (10 reps, 120° target).<br>• Notes from Dr. Ananya Sharma. |
| **`/patient/onboarding`** | **7-Step Calibration** | • Guided wizard checking camera distance (6–10 ft), lighting, and body visibility.<br>• Live readiness test showing *"READY TO BEGIN"*. |
| **`/patient/exercise/elbow-flexion`** | **Live Camera Exercise** | • Fullscreen camera feed with overlaid pose skeleton.<br>• Real-time joint angle tag (e.g. `104°`) at the elbow vertex.<br>• Rep counter (`07 / 10`) with cadence and audio cues.<br>• **Confidence Gate**: Block camera or select *Low Confidence* $\to$ notice amber banner *"Movement analysis paused"*.<br>• Real vs. Simulation mode toggle in the top bar. |
| **`/patient/progress`** | **Progress Dashboard** | • Recharts AreaChart of ROM progression over time (82° $\to$ 114°).<br>• Consistency BarChart.<br>• 4-week recovery milestone roadmap.<br>• 10-session historical telemetry log. |
| **`/patient/manual`** | **Camera-Free Mode** | • Manual rep logger with exercise instructions for low-mobility or camera-less setups. |
| **`/therapist/dashboard`** | **Clinical Census** | • Census overview: 14 active patients, 1 flagged session pending.<br>• Patient card for Aarav Mehta with amber review alert badge. |
| **`/therapist/review/session-hist-6`** | **Session Review & Override** | • Inspect flagged Rep #6: Observed 108° vs Prescribed 120°.<br>• **Clinician Override**: Adjust target ROM to 110°, enter clinical rationale, click save $\to$ patient plan updates in real time! |
| **`/therapist/exercises`** | **Exercise Config** | • Clinical configurator for adjusting target ROM, reps, tempo, and instructions. |

---

## 🎬 3-Minute Live Hackathon Demo Walkthrough

Follow this sequence to showcase the complete closed-loop product to judges:

1. **Start at `/demo`**:
   - Click **"Launch Patient Dashboard"** as **Aarav Mehta**.
2. **Patient Dashboard** (`/patient/dashboard`):
   - Highlight the 6-day streak, +18% ROM trend, and note from **Dr. Ananya Sharma**.
   - Click **"Start Today's Workout"**.
3. **Live Camera Exercise** (`/patient/exercise/elbow-flexion`):
   - Show the full-screen camera view with pose skeleton and live angle arc.
   - Perform arm reps (or leave in *Simulation Mode*): watch the rep counter increment with audio cues.
   - **Showcase Core Differentiator (Confidence Gate)**:
     - Block the camera or switch the simulation dropdown to *Low Confidence*.
     - Point out the amber alert: *"Movement Analysis Paused — Please make sure your full body is visible."*
     - Explain: *RehabSense never guesses or provides inaccurate feedback when tracking confidence drops.*
   - Click **"Complete & Store Session"** to view session performance metrics.
4. **Progress Trends** (`/patient/progress`):
   - Show longitudinal charts across 10 historical sessions.
5. **Switch to Therapist** (Click **Therapist** in the top-right navbar):
   - Land on the Clinical Census (`/therapist/dashboard`).
   - Notice Aarav Mehta's card with an amber alert: **"1 Flagged Session Pending Review"**.
   - Click **"Review Flagged Reps"**.
6. **Execute Clinician Override** (`/therapist/review/session-hist-6`):
   - Point out the flag on Rep #6: Observed 108° vs Prescribed 120°.
   - Slide target ROM to **110°**, enter clinical justification (*"Temporary reduced ROM target for progressive recovery"*), and click **Save**.
7. **Verify Real-Time Loop**:
   - Switch back to **Patient** in the top navbar $\to$ observe that Aarav's active prescription has updated to **110°** immediately!

---

## 🔑 Demo Accounts

| Role | Email | Password | Persona & Background |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@rehabsense.demo` | `Demo@123` | **Aarav Mehta** (32 y/o, Post-operative upper-limb rehabilitation) |
| **Therapist** | `therapist@rehabsense.demo` | `Demo@123` | **Dr. Ananya Sharma** (Lead Musculoskeletal Physiotherapist) |

*(Note: You can switch between roles with 1 click using the buttons in the top navbar or via `/demo` without typing credentials).*

---

## ♿ Accessibility Features

- **Large Typography**: Click the `T` icon in the navbar to enlarge font size for distant viewing.
- **High Contrast Mode**: Click the eye icon in the navbar for high-contrast dark theme.
- **Speech Synthesis (Web Speech API)**: Toggleable audio rep counter and cadence feedback.
- **Camera-Free Mode** (`/patient/manual`): Complete manual rep logger and guide for patients without webcam access.

---

## ❓ Troubleshooting

### Port 8000 or 3000 is already in use
```bash
# Find and terminate process on port 8000
lsof -ti:8000 | xargs kill -9

# Find and terminate process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Camera Permission Denied or Unavailable
RehabSense automatically detects camera unavailability and smoothly switches to **Simulation Mode** with zero crashes. You can also manually toggle between **Camera** and **Simulation** using the top bar switch during any exercise.

### Resetting to Clean Demo Data
Visit [http://localhost:3000/demo](http://localhost:3000/demo) and click **"Reset Demo to Clean Baseline"**, or execute in terminal:
```bash
python3 apps/api/seed.py
```

---

## 📁 Repository Structure

```
rehab/
├── apps/
│   ├── web/                        # Next.js 14 App Router Frontend
│   │   ├── src/app/                # 11 routes (/, /demo, /patient/*, /therapist/*)
│   │   ├── src/components/         # TopNavbar, PoseCanvas, JointAngleGauge, etc.
│   │   └── src/lib/                # API client, Auth & Accessibility contexts
│   └── api/                        # Python FastAPI Backend
│       ├── main.py                 # API entrypoint with permissive CORS
│       ├── config.py               # JWT and MongoDB configurations
│       ├── database.py             # MongoDB Motor client + In-Memory Fallback
│       ├── seed.py                 # Pre-seeded clinical demo dataset
│       ├── models/schemas.py       # Pydantic v2 data models
│       └── routers/                # Auth, Patients, Exercises, Prescriptions, Sessions, Therapist, Demo
├── packages/
│   ├── types/                      # Shared TypeScript data contracts
│   ├── exercise-engine/            # Computer vision angle math, confidence gate, simulator
│   └── config/                     # Clinical ranges, defaults, and disclaimers
├── docs/                           # Architecture, Exercise Engine, Demo Script, Safety
├── scripts/
│   ├── run-dev.sh                  # One-command dual dev runner
│   └── verify-all.sh               # One-command full test suite
├── docker-compose.yml              # Containerized multi-service setup
└── README.md                       # Master documentation guide
```

---

**Team TechHives** • Problem Statement 05 (PS 05) — Camera-Assisted Home Rehabilitation Coach.
