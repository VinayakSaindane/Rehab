# RehabSense — Camera-Assisted Home Rehabilitation Coach
> **"Your Recovery. Your Camera. Your Care Team."**  
> **Problem Statement**: PS 05 — Camera-Assisted Home Rehabilitation Coach  
> **Team**: TechHives  
> **Version**: 1.0.0 (Production-Ready Prototype)  

---

## 📑 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Computer Vision & Exercise Engine](#4-computer-vision--exercise-engine)
5. [End-to-End System Flow & Working](#5-end-to-end-system-flow--working)
6. [Database Schema & Data Models](#6-database-schema--data-models)
7. [API Endpoints Reference](#7-api-endpoints-reference)
8. [Accessibility, Inclusivity & Safety](#8-accessibility-inclusivity--safety)
9. [Project Directory Structure](#9-project-directory-structure)
10. [Setup, Verification & Quickstart](#10-setup-verification--quickstart)

---

## 1. Executive Summary

### 1.1 The Challenge
Physical therapy and musculoskeletal rehabilitation require consistent, repetitive exercise routines performed with strict postural adherence. When performed at home without clinical supervision, patients face critical obstacles:
- **No Real-Time Feedback**: Patients are unsure if their Range of Motion (ROM), joint alignment, or movement speed are correct.
- **Risk of Compensatory Movement**: Patients unconsciously recruit incorrect muscles or under-flex to avoid discomfort, entrenching improper biomechanics or risking re-injury.
- **Disconnected Care Teams**: Therapists have no objective data on compliance or kinematic accuracy between sporadic clinic visits.
- **Privacy Concerns**: Patients are uncomfortable streaming live home webcam footage to cloud servers.

### 1.2 The RehabSense Solution
**RehabSense** is an intelligent, camera-assisted, closed-loop rehabilitation platform combining:
1. **Edge-First Computer Vision**: 100% browser-side joint tracking via Google MediaPipe Pose, ensuring zero raw video or facial frames ever leave the patient's device.
2. **Confidence-Gated Kinematic Analysis**: Deterministic joint angle calculation that automatically pauses form evaluation whenever lighting, occlusion, or distance degrade landmark confidence.
3. **Closed-Loop Clinician Oversight**: Real-time telemetry ingestion enabling therapists to monitor patient adherence, inspect flagged kinematic deviations, and dynamically override target ROM prescriptions.
4. **Resilient Multimodal Accessibility**: Web Speech API audio coaching, WCAG-AA high contrast mode, dynamic font scaling, and a camera-free manual logging fallback for low-mobility setups.

---

## 2. High-Level Architecture

RehabSense is architected around a **dual-loop topology**:
- **Patient Fast Loop (30–60 FPS)**: Real-time video frame capture, edge pose estimation, trigonometric angle derivation, state machine rep counting, audio feedback, and visual HUD overlays—all executing locally in browser memory.
- **Clinician Longitudinal Loop (Asynchronous)**: Transmission of structured, privacy-preserving numeric metrics (`POST /api/sessions`), population census monitoring, kinematic anomaly flagging, and prescription recalibration.

```
                              +-------------------------------------------------------+
                              |                    PATIENT CLIENT                     |
                              |              (Next.js 14 App / TypeScript)            |
                              |                                                       |
                              |   [User Webcam]                                       |
                              |         | (Video Frames - Ephemeral RAM)              |
                              |         v                                             |
                              |   [MediaPipe Pose Landmarker (Wasm/WebGL)]            |
                              |         | (33 Normalized 3D Coordinates)              |
                              |         v                                             |
                              |   [Confidence & Occlusion Gate]                       |
                              |      ├── Confidence < 75% -> Pause HUD Banner         |
                              |      └── Confidence >= 75%                            |
                              |         v                                             |
                              |   [Vector Joint Angle Calculator]                     |
                              |         v                                             |
                              |   [Repetition State Machine (Hysteresis)]             |
                              |         v                                             |
                              |   [Explainable Audio/Visual Feedback Engine]          |
                              +-------------------------------------------------------+
                                                        |
                                                        | POST /api/sessions
                                                        | (Pure Numeric Metrics: ROM, Reps, Flags)
                                                        | *NO VIDEO OR FACIAL DATA TRANSMITTED*
                                                        v
                              +-------------------------------------------------------+
                              |                  BACKEND REST API                     |
                              |               (Python FastAPI / Uvicorn)              |
                              |                                                       |
                              |   - JWT Authentication & Role-Based Access Control    |
                              |   - Pydantic v2 Kinematic Schema Validation           |
                              |   - Session Telemetry Ingestion & Scoring Engine      |
                              |   - Clinician Review & Prescription Override Engine   |
                              |   - Notification Event Dispatcher                     |
                              |                                                       |
                              |         |                                             |
                              |         v                                             |
                              |   [Data Persistence Layer]                            |
                              |   - Primary: MongoDB (Motor Async Driver)             |
                              |   - Resilient Fallback: Auto In-Memory Store          |
                              +-------------------------------------------------------+
                                                        |
                                                        | Telemetry Data & Flagged Reps
                                                        v
                              +-------------------------------------------------------+
                              |                 CLINICIAN PORTAL                      |
                              |             (Next.js 14 Therapist Hub)                |
                              |                                                       |
                              |   - Population Health & Census Dashboard              |
                              |   - Kinematic Deviation Inspector (Flagged Reps)      |
                              |   - Real-Time Prescription Target Override            |
                              |   - Clinical Exercise Configurator                    |
                              +-------------------------------------------------------+
```

---

## 3. Technology Stack

### 3.1 Frontend Web Application (`apps/web`)
| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | 14.2+ | Server-side rendering, client routing, API caching, static optimization |
| **Language** | TypeScript | 5.4+ | Strict type safety across clinical contracts and kinematic models |
| **Styling** | Tailwind CSS + Vanilla CSS | 3.4+ | Glassmorphic design system, responsive breakpoints, custom dark mode |
| **Data Visualization** | Recharts | 2.12+ | Longitudinal ROM progression AreaCharts, consistency BarCharts |
| **Icons** | Lucide React | Latest | Accessible, modern iconography |
| **Audio Guidance** | Web Speech API | Native | Real-time cadence prompts and repetition counting ("Rep 7 complete") |
| **Camera Feed** | `navigator.mediaDevices` | HTML5 | Low-latency local camera stream ingestion via `<video>` & `<canvas>` |

### 3.2 Computer Vision & Kinematic Engine (`packages/exercise-engine`)
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Pose Detection** | `@mediapipe/tasks-vision` | Edge-based 33-point body landmark tracking via WebAssembly/WebGL |
| **Kinematic Math** | Vector Linear Algebra | Dot product cosine theorem for joint flexion/extension angles |
| **State Machine** | Custom Finite State Machine | Hysteresis buffering and debounce timers to eliminate double-counting |
| **Simulation Mode** | Deterministic Kinematic Generator | Fallback synthetic landmark generator for testing and live demonstrations |

### 3.3 Backend API (`apps/api`)
| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | FastAPI | 0.110+ | High-throughput asynchronous Python ASGI web framework |
| **ASGI Server** | Uvicorn | 0.28+ | Lightning-fast ASGI production server |
| **Validation** | Pydantic v2 | 2.6+ | Strict data schemas, clinical range validation, JSON serialization |
| **Security & Auth** | `python-jose`, `passlib` | Latest | Stateless JWT (HS256) bearer tokens, bcrypt salted password hashing |
| **Environment** | `python-dotenv` | Latest | Configuration management via environment variables |

### 3.4 Data Persistence & Storage
| Store | Technology | Mode | Details |
| :--- | :--- | :--- | :--- |
| **Primary Database** | MongoDB | Motor (Async) | Document storage for users, prescriptions, sessions, notifications |
| **Resilient Store** | In-Memory Engine | Auto-Engaged Fallback | Transparent fallback if MongoDB is unreachable—ensures 100% uptime |

### 3.5 Monorepo & DevOps Tooling
- **Package Manager**: npm workspaces (`apps/*`, `packages/*`)
- **CI / CD Pipeline**: GitHub Actions (`.github/workflows/ci.yml`) validating Next.js builds, Python typing, and Pydantic schemas on matrix versions (Node 18/20, Python 3.10/3.11)
- **Containerization**: Multi-container `docker-compose.yml` (Web, API, MongoDB)
- **Automated Verification**: Shell scripts (`scripts/run-dev.sh`, `scripts/verify-all.sh`)

---

## 4. Computer Vision & Exercise Engine

### 4.1 Joint Angle Trigonometric Derivation
Joint angles are calculated between three spatial landmark vectors centered at vertex $B$.
Given points $A$ (proximal), $B$ (vertex joint), and $C$ (distal):

$$\vec{BA} = A - B, \quad \vec{BC} = C - B$$

$$\cos \theta = \frac{\vec{BA} \cdot \vec{BC}}{\|\vec{BA}\| \|\vec{BC}\|}$$

$$\theta = \arccos\left(\text{clamp}(\cos \theta, -1.0, 1.0)\right) \times \frac{180}{\pi}$$

#### Clinical Joint Mappings (MediaPipe 33-Landmark Standard)
- **Elbow Flexion / Extension**:
  - $A$: Left Shoulder (`index: 11`)
  - $B$ (Vertex): Left Elbow (`index: 13`)
  - $C$: Left Wrist (`index: 15`)
- **Shoulder Flexion / Abduction**:
  - $A$: Left Hip (`index: 23`)
  - $B$ (Vertex): Left Shoulder (`index: 11`)
  - $C$: Left Elbow (`index: 13`)
- **Knee Extension (Sit-to-Stand / Squat)**:
  - $A$: Left Hip (`index: 23`)
  - $B$ (Vertex): Left Knee (`index: 25`)
  - $C$: Left Ankle (`index: 27`)

### 4.2 The Confidence & Occlusion Gate (Core Differentiator)
A standard problem in camera-based rehabilitation is that poor lighting or body clipping causes erratic landmark flutters, leading to false repetition counts or erroneous form deductions.

RehabSense implements a **Multi-Stage Confidence Gate**:
1. **Per-Joint Visibility Filter**: Ensures critical landmarks maintain confidence score $\ge 0.70$.
2. **Boundary Proximity Check**: Detects if joints are clipped at the camera viewport frame edges ($0.02 \le x, y \le 0.98$).
3. **Temporal Smoothing (EMA)**: Exponential moving average filters single-frame noise:
   $$\bar{C}_t = \alpha \cdot C_t + (1 - \alpha) \cdot \bar{C}_{t-1}, \quad \text{where } \alpha = 0.7$$
4. **Behavior on Failure**:
   - Form evaluation and repetition incrementing are immediately **frozen**.
   - An amber HUD banner appears: *"Movement analysis paused — Please make sure your full body is visible."*
   - Explains the exact joint obscured (e.g. *"Required joint obscured: left wrist"*).

### 4.3 Repetition State Machine
To guarantee physiological accuracy and debounce micro-movements, repetitions are evaluated via a 4-state Finite State Machine with hysteresis:

```
    [ REST STATE ]  (Arm extended: Angle ~155°)
          │
          │ Angle drops past (StartAngle - HysteresisBuffer) [e.g. <= 145°]
          ▼
   [ MOVING STATE ]  (Flexion phase active)
          │
          │ Angle enters prescribed Target Range [e.g. <= 120°]
          ▼
 [ TARGET_ZONE ]  (Peak ROM recorded, prompt return phase)
          │
          │ Angle returns back past ReturnAngle [e.g. >= 145°]
          ▼
  [ COMPLETED ]  (Evaluate Rep Validity, fire audio chime, increment counter)
          │
          ▼ Auto-reset
    [ REST STATE ]
```

- **Repetition Validity Rules**: A rep is marked `isValid = true` only if the measured peak ROM achieved the therapist's prescribed target within allowable tolerance:
  $$\text{Peak ROM} \le \text{Target ROM} + \text{Tolerance}$$
- **Kinematic Anomaly Flagging**: If a patient reverses movement before reaching the prescribed ROM threshold (e.g., stopping at $108^\circ$ when the prescribed target is $120^\circ$), the repetition is flagged as `range_below_target` and queued for clinical review.

---

## 5. End-to-End System Flow & Working

### 5.1 Patient Journey
1. **Instant Demo Authentication (`/demo` or `/api/auth/demo-switch`)**:
   - The user selects **Aarav Mehta** (`patient@rehabsense.demo`). A secure JWT token is minted and stored in local state.
2. **Patient Dashboard (`/patient/dashboard`)**:
   - Fetches active rehabilitation plan, consecutive daily streak, historical compliance score, and clinical notes from Dr. Ananya Sharma.
3. **Camera Onboarding & Calibration (`/patient/onboarding`)**:
   - 7-step guided setup verifying environment distance (6–10 ft), camera height, lighting, and joint visibility before allowing workout initiation.
4. **Live Exercise Session (`/patient/exercise/elbow-flexion`)**:
   - Real-time video canvas with joint skeleton overlay and live angle gauge.
   - Real-time cadence metronome and audio encouragement via Web Speech API.
   - Live confidence gating alerting the patient if they move out of frame.
5. **Session Telemetry Ingestion (`POST /api/sessions`)**:
   - At the conclusion of the workout, the client compiles an aggregated kinematic payload (duration, total reps, valid reps, peak ROM, form flags) and securely transmits it to the backend.
6. **Progress Tracking (`/patient/progress`)**:
   - Longitudinal Recharts visualization displaying 10-session trendline towards full functional recovery.

### 5.2 Therapist Journey & Closed-Loop Clinical Override
1. **Therapist Census (`/therapist/dashboard`)**:
   - Dr. Ananya Sharma logs in and views her patient roster.
   - Aarav Mehta's card displays an amber badge: **"1 Flagged Session Pending Review"**.
2. **Session Kinematic Review (`/therapist/review/session-hist-6`)**:
   - Therapist inspects Rep #6, where Aarav exhibited under-flexion ($108^\circ$ vs prescribed $120^\circ$).
3. **Clinician Prescription Override**:
   - Dr. Sharma adjusts the target ROM slider from $120^\circ$ to $110^\circ$, enters a clinical rationale (*"Temporary reduced ROM target for progressive recovery"*), and clicks **Save & Update Prescription**.
4. **Real-Time Patient Propagation**:
   - The backend validates the override via Pydantic, updates the prescription record, and generates a notification.
   - When Aarav navigates to his dashboard, his target ROM is immediately updated to $110^\circ$ with a clinician note.

---

## 6. Database Schema & Data Models

All models are strictly defined in `apps/api/models/schemas.py` using **Pydantic v2**:

### 6.1 User Schema (`UserRecord`)
```python
class UserRecord(BaseModel):
    id: str                         # Unique user ID (e.g. 'user-patient-aarav')
    email: EmailStr                 # Unique login email
    role: UserRole                  # 'PATIENT' | 'THERAPIST'
    name: str                       # Full name (e.g. 'Aarav Mehta')
    created_at: datetime
    active_prescription_id: Optional[str] = None
```

### 6.2 Prescription Schema (`PrescriptionRecord`)
```python
class PrescriptionRecord(BaseModel):
    id: str                         # Unique prescription ID
    patient_id: str                 # Assigned patient ID
    therapist_id: str               # Prescribing clinician ID
    exercise_id: str                # e.g. 'elbow-flexion'
    target_reps: int                # e.g. 10 reps (range: 1 - 100)
    target_rom: int                 # Prescribed ROM in degrees (60° - 135°)
    frequency_per_day: int          # Recommended daily frequency
    notes: Optional[str]            # Clinician instructions
    updated_at: datetime
```

### 6.3 Session Telemetry Schema (`SessionCreate`)
```python
class SessionCreate(BaseModel):
    patient_id: str
    exercise_id: str
    duration_seconds: int           # Total session duration
    target_reps: int                # Target repetitions prescribed
    completed_reps: int             # Total attempted repetitions
    valid_reps: int                 # Repetitions meeting clinical criteria
    average_rom: float              # Mean achieved ROM across reps
    max_rom: float                  # Peak achieved ROM
    tracking_confidence: float      # Mean landmark tracking confidence
    form_flags: List[str] = []      # e.g. ['range_below_target', 'asymmetry']
```

### 6.4 Review & Override Schema (`ReviewSubmission`)
```python
class ReviewSubmission(BaseModel):
    notes: str                      # Clinical evaluation notes
    status: str = "reviewed"        # 'reviewed' | 'escalated'
    target_rom_override: Optional[int] = None  # New target ROM (60° - 135°)
    adjust_reps: Optional[int] = None          # Adjusted target reps
```

---

## 7. API Endpoints Reference

| HTTP Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | System health check and storage status (`mongodb` or `in-memory-fallback`) |
| `POST` | `/api/auth/demo-switch` | Public | Instant 1-click role switcher returning a valid JWT access token |
| `POST` | `/api/auth/token` | Public | Standard OAuth2 password credentials authentication |
| `GET` | `/api/patients/me/dashboard` | Patient | Patient dashboard telemetry, active prescription, streak & notifications |
| `GET` | `/api/patients/me/progress` | Patient | Historical multi-session kinematic data and milestone roadmap |
| `POST` | `/api/sessions` | Patient | Ingests completed exercise telemetry, calculates scores, and flags anomalies |
| `GET` | `/api/therapist/dashboard` | Therapist | Clinical population census, patient compliance rates, pending flagged reps |
| `GET` | `/api/therapist/sessions/{id}`| Therapist | Detailed kinematic drilldown for a single session and its repetitions |
| `POST` | `/api/therapist/sessions/{id}/review` | Therapist | Clinician override: updates prescription ROM and records clinical justification |
| `GET` | `/api/exercises` | Authenticated| Returns clinical exercise library with biomechanical definitions |
| `POST` | `/api/demo/reset` | Public | Restores demo database to clean baseline with pre-seeded history |

---

## 8. Accessibility, Inclusivity & Safety

### 8.1 Accessibility Suite
- **Large Typography Mode**: Dynamic text scaling via top navigation `T` toggle for patients exercising 6–10 feet away from laptop screens.
- **WCAG-AA High Contrast**: One-click high-contrast mode with rich dark backgrounds and high-legibility amber/cyan accents.
- **Audio Cadence Synthesizer**: Web Speech API real-time voice feedback announcing repetition counts and pacing cues so patients do not need to strain to read the screen.
- **Camera-Free Mode (`/patient/manual`)**: Dedicated manual logger with animated SVG exercise diagrams for low-mobility patients or hardware-limited environments.

### 8.2 Clinical Safety Disclaimers & Privacy Guardrails
1. **Medical Disclaimer**: Prominent notices throughout the application stating that RehabSense is a rehabilitation support tool and does not substitute for emergency medical care.
2. **Zero-Raw-Video Privacy Guarantee**: All video processing occurs in browser ephemeral memory via WebAssembly; no video frames or identifiable face data are ever stored or transmitted over HTTP.
3. **Graceful Failover**: If camera access is denied or hardware fails, the application automatically switches to **Simulation Mode** without breaking the user experience.

---

## 9. Project Directory Structure

```
rehab/
├── apps/
│   ├── web/                              # Next.js 14 Web Application
│   │   ├── src/
│   │   │   ├── app/                      # Next.js App Router Pages
│   │   │   │   ├── page.tsx              # Public Landing Page & Demo Hero
│   │   │   │   ├── demo/page.tsx         # Judge Demo Hub (1-Click Switcher)
│   │   │   │   ├── patient/
│   │   │   │   │   ├── dashboard/page.tsx# Patient Dashboard & Daily Plan
│   │   │   │   │   ├── onboarding/page.tsx# 7-Step Camera Calibration Wizard
│   │   │   │   │   ├── exercise/[id]/    # Live Computer Vision Exercise Room
│   │   │   │   │   ├── progress/page.tsx # Longitudinal Progress & Charts
│   │   │   │   │   └── manual/page.tsx   # Camera-Free Manual Rep Logger
│   │   │   │   └── therapist/
│   │   │   │       ├── dashboard/page.tsx# Clinical Census & Flagged Patient List
│   │   │   │       ├── review/[id]/      # Session Review & Clinician Override
│   │   │   │       └── exercises/        # Clinical Exercise Configuration
│   │   │   ├── components/               # UI & Biomechanical Components
│   │   │   │   ├── TopNavbar.tsx         # Navbar with Role Badge, A11y & Reset
│   │   │   │   ├── PoseCanvas.tsx        # HTML5 Canvas Pose Skeleton Overlay
│   │   │   │   ├── JointAngleGauge.tsx   # Circular Kinematic Degree Meter
│   │   │   │   ├── ConfidenceGateBanner.tsx # Amber Occlusion Alert Banner
│   │   │   │   ├── NotificationBell.tsx  # Clinical Updates & Notification Center
│   │   │   │   └── ErrorBoundary.tsx     # Global Crash Protection Boundaries
│   │   │   └── lib/                      # Client Core Utilities
│   │   │       ├── api.ts                # Axios-style Fetch Client with JWT Handling
│   │   │       ├── auth-context.tsx      # Auth State & 1-Click Role Switcher
│   │   │       └── accessibility-context.tsx # High Contrast & Large Text Controls
│   │   └── package.json
│   │
│   └── api/                              # Python FastAPI Backend
│       ├── main.py                       # App Entrypoint, Permissive CORS, Routers
│       ├── config.py                     # App Settings, Secret Keys, DB URLs
│       ├── database.py                   # Async Motor Client + In-Memory Fallback
│       ├── seed.py                       # Pre-seeded Clinical Dataset Generator
│       ├── models/
│       │   └── schemas.py                # Pydantic v2 Models & ROM Validators
│       ├── routers/                      # Modular API Route Controllers
│       │   ├── auth.py                   # Demo Login & JWT Issuance
│       │   ├── patients.py               # Patient Dashboard & Progress
│       │   ├── sessions.py               # Telemetry Ingestion Engine
│       │   ├── therapist.py              # Census & Prescription Overrides
│       │   ├── exercises.py              # Biomechanical Exercise Definitions
│       │   └── demo.py                   # Instant Database Reset Endpoint
│       └── requirements.txt              # Pinned Python Dependencies
│
├── packages/
│   ├── types/                            # Shared TypeScript Kinematic Contracts
│   ├── exercise-engine/                  # Standalone Vision Math & Simulation Engine
│   │   ├── angle-calculator.ts           # Vector Trigonometry Math
│   │   ├── confidence-gate.ts            # Occlusion & Visibility Filters
│   │   ├── repetition-detector.ts        # Hysteresis State Machine
│   │   └── simulation-engine.ts          # Deterministic Kinematic Landmark Generator
│   └── config/                           # Clinical Defaults & Reference Angle Limits
│
├── docs/                                 # Architectural & Clinical Specifications
│   ├── architecture.md                   # System Topology & Edge Privacy Design
│   ├── exercise-engine.md                # Kinematic Formulae & Landmark Indices
│   ├── demo-script.md                    # 3-Minute Live Hackathon Presentation Script
│   └── safety.md                         # Clinical Guardrails & Risk Governance
│
├── .github/workflows/
│   └── ci.yml                            # GitHub Actions CI (Node/Python Matrix)
├── docker-compose.yml                    # Dockerized Multi-Service Deployment
├── package.json                          # Monorepo Workspace Scripts
└── README.md                             # Quickstart & Verification Guide
```

---

## 10. Setup, Verification & Quickstart

### 10.1 Quickstart (Dual Service Runner)
To launch both the FastAPI backend and Next.js frontend concurrently:
```bash
./scripts/run-dev.sh
```
- 🌐 **Web Application**: [http://localhost:3000](http://localhost:3000)
- 🎯 **Judge Demo Hub**: [http://localhost:3000/demo](http://localhost:3000/demo)
- 📚 **FastAPI Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 10.2 Automated Verification Suite
To execute end-to-end tests across the vector math, API endpoints, database, and frontend compilation:
```bash
./scripts/verify-all.sh
```

### 10.3 Pre-Seeded Demo Personas
| Role | User Name | Email | Password | Clinical Context |
| :--- | :--- | :--- | :--- | :--- |
| **Patient** | **Aarav Mehta** | `patient@rehabsense.demo` | `Demo@123` | 32 y/o, post-operative upper limb rehabilitation (Elbow Flexion) |
| **Therapist** | **Dr. Ananya Sharma** | `therapist@rehabsense.demo` | `Demo@123` | Lead Musculoskeletal Physiotherapist overseeing clinical census |

---
**Team TechHives** • Problem Statement 05 (PS 05) — Camera-Assisted Home Rehabilitation Coach.
