# RehabSense Hackathon Demonstration Script

**Title**: PS 05 — Camera-Assisted Home Rehabilitation Coach  
**Team**: TechHives  
**Target Duration**: 3 Minutes

---

## Act 1: The Clinical Challenge (0:00 - 0:30)

> *"Judges, over 70% of physical rehabilitation occurs at home, where patients have no guidance and clinicians have zero objective visibility. Existing consumer fitness apps either count bad repetitions blindly or try to replace doctors with generic AI chatbots.*  
> 
> *Meet **RehabSense**: Your Recovery. Your Camera. Your Care Team. It uses computer vision with a strict **Confidence Gate** and **Therapist-Configured Targets** to assist recovery without making medical claims."*

---

## Act 2: The Patient Experience & Camera Intelligence (0:30 - 1:30)

1. **Open Landing Page** (`/`):
   - Highlight the 6-step flow (Capture $\to$ Detect $\to$ Analyze $\to$ Validate $\to$ Feedback $\to$ Review).
   - Point out **Privacy by Design**: All pose estimation occurs in-browser; raw video never leaves the device.

2. **Click "Try Patient Demo"** (`/patient/dashboard`):
   - Note patient greeting for **Aarav Mehta** (Post-operative upper-limb rehabilitation).
   - Point out current streak (6 days) and longitudinal movement progress (+18% ROM).
   - Show note from **Dr. Ananya Sharma**.

3. **Start Live Camera Exercise** (`/patient/exercise/elbow-flexion`):
   - Show the full-screen camera HUD with pose skeleton and real-time joint angle tag (e.g. `104°`).
   - Move your arm (or toggle **Simulation Mode**):
     - Watch the Rep Counter increment smoothly with cadence and audio cues.
   - **Trigger the Core Differentiator**: Block the camera or switch to *Low Confidence* pattern:
     - Show the amber banner: *"Movement Analysis Paused — Please make sure your full body is visible."*
     - Emphasize: **We never guess or generate false feedback when tracking confidence is low.**
   - Complete the exercise: Review the **Session Complete** modal showing valid reps, average ROM, and adherence bars.

---

## Act 3: Closing the Loop — The Therapist Review (1:30 - 2:30)

1. **Switch Role to Therapist** (1-click toggle in navbar):
   - Land on the **Clinical Census** (`/therapist/dashboard`).
   - Point out Aarav Mehta's card displaying **1 Flagged Session Pending Review**.

2. **Open Session Review** (`/therapist/review/session-hist-6`):
   - Point out the flagged event: **Rep #6 achieved 108° vs prescribed 120°**.
   - Show the clinical dilemma: Did the patient struggle with stiffness, or was the target too aggressive?

3. **Execute Clinician Override**:
   - Slide target ROM to **110°**.
   - Enter rationale: *"Temporary reduced ROM target to accommodate post-operative stiffness."*
   - Click **Save Review & Override Target**.

4. **Verify Real-Time Loop**:
   - Switch back to Patient. Open `/patient/dashboard`.
   - Observe that Aarav's active prescription has been updated in real-time to the new 110° target!

---

## Act 4: Accessibility & Architecture (2:30 - 3:00)

- Demonstrate **Accessibility Features**: High contrast mode, large text, voice cues, and **Camera-Free Mode** (`/patient/manual`).
- Show the clean Monorepo, FastAPI backend with MongoDB, and browser-side MediaPipe engine.
- Conclude: *"RehabSense bridges the gap between home recovery and clinical precision."*
