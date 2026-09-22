# RehabSense Architecture

**Platform**: RehabSense — Camera-Assisted Home Rehabilitation Coach  
**Team**: TechHives (Problem Statement 05)  
**Tagline**: *"Your Recovery. Your Camera. Your Care Team."*

---

## 1. System Topology

```
                  +-------------------------------------------------------+
                  |                   PATIENT CLIENT                      |
                  |                (Next.js App / Web)                    |
                  |                                                       |
                  |  [Device Camera]                                      |
                  |         |                                             |
                  |         v (Frames)                                    |
                  |  [MediaPipe Pose Landmarker (Browser-Side CV)]        |
                  |         |                                             |
                  |         v (33 Normalized Landmarks)                   |
                  |  [Confidence Gate] ---> (Low: Pause Form Evaluation)  |
                  |         | (High Confidence >= 75%)                    |
                  |         v                                             |
                  |  [Joint Angle Calculator & ROM Tracker]               |
                  |         |                                             |
                  |         v                                             |
                  |  [Repetition State Machine (Hysteresis & Debounce)]   |
                  |         |                                             |
                  |         v                                             |
                  |  [Explainable Feedback Engine] <-> [Web Speech API]   |
                  +-------------------------------------------------------+
                                            |
                                            | POST /sessions
                                            | (Structured Numeric Metrics ONLY)
                                            | No raw video ever transmitted
                                            v
                  +-------------------------------------------------------+
                  |                   BACKEND API                         |
                  |                 (Python FastAPI)                      |
                  |                                                       |
                  |  - Auth & Role Verification (JWT, bcrypt)             |
                  |  - Patient Telemetry Ingestion                        |
                  |  - Prescription Management                            |
                  |  - Therapist Review & Target Override Engine          |
                  |                                                       |
                  |         |                                             |
                  |         v                                             |
                  |  [Database Layer]                                     |
                  |  - Primary: MongoDB (Motor async driver)              |
                  |  - Fallback: Auto In-Memory / JSON Resilient Store    |
                  +-------------------------------------------------------+
                                            |
                                            | Telemetry & Reviews
                                            v
                  +-------------------------------------------------------+
                  |                 THERAPIST DASHBOARD                   |
                  |             (Next.js Clinician Portal)                |
                  |                                                       |
                  |  - Patient Rehabilitation Census                      |
                  |  - Flagged Kinematic Event Review                     |
                  |  - Prescription Target Recalibration (Override)       |
                  |  - Clinical Exercise Configurator                     |
                  +-------------------------------------------------------+
```

---

## 2. Component Directory Layout

```
rehab/
├── apps/
│   ├── web/                        # Next.js 14 App Router, Tailwind, Recharts, Lucide
│   │   ├── src/app/                # App routes (/, /demo, /patient/*, /therapist/*)
│   │   ├── src/components/         # PoseCanvas, JointAngleGauge, ConfidenceGateBanner
│   │   └── src/lib/                # API client, auth context, accessibility context
│   └── api/                        # Python FastAPI Backend
│       ├── main.py                 # App entrypoint and CORS configuration
│       ├── config.py               # Environment and settings
│       ├── database.py             # MongoDB Motor client + in-memory fallback
│       ├── seed.py                 # Realistic seed data for Aarav Mehta & Dr. Sharma
│       ├── models/schemas.py       # Pydantic v2 schemas
│       └── routers/                # Auth, Patients, Exercises, Prescriptions, Sessions, Therapist, Demo
├── packages/
│   ├── types/                      # Shared TypeScript contracts and interfaces
│   ├── exercise-engine/            # Computer vision, angle math, state machine, simulator
│   └── config/                     # Clinical defaults and initial exercise library
├── docs/                           # Architecture, Exercise Engine, Demo Script, Safety
├── scripts/                        # Runner scripts and seeds
├── docker-compose.yml              # Multi-container deployment configuration
└── README.md                       # Master documentation
```

---

## 3. Privacy by Design Data Flow

RehabSense strictly adheres to zero-raw-video telemetry persistence:
1. **Edge Processing**: Camera video frames are consumed exclusively in ephemeral browser memory by MediaPipe's WebAssembly / WebGL worker.
2. **Feature Extraction**: Video is discarded immediately after extracting 33 normalized landmark coordinates.
3. **Structured Metrics Transmission**: The client only transmits structured session metrics to `POST /api/sessions`:
```json
{
  "exercise_id": "elbow-flexion",
  "duration_seconds": 240,
  "target_reps": 10,
  "completed_reps": 8,
  "valid_reps": 7,
  "average_rom": 104,
  "max_rom": 110,
  "tracking_confidence": 0.93,
  "form_flags": ["range_below_target"]
}
```
No raw video or identifiable biometric facial imagery is ever stored on the server.
