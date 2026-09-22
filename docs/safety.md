# RehabSense Safety & Medical Positioning Framework

**Team TechHives**  
**Problem Statement 05 — Camera-Assisted Home Rehabilitation Coach**

---

## 1. Regulatory & Medical Positioning

RehabSense is an **assistive movement monitoring prototype** designed to aid patients in executing home exercise protocols prescribed by licensed clinicians.

### Explicit Medical Disclaimers
1. **Non-Diagnostic**: RehabSense is **NOT** a diagnostic medical device. It does not diagnose musculoskeletal pathology, nerve impingements, tears, or post-surgical failure.
2. **Physiotherapist Authority**: The platform does not replace a licensed physiotherapist. Exercise selection, target repetitions, range-of-motion ceilings, and rehabilitation progression must be configured by a qualified human clinician.
3. **Symptom Caution**: Every screen prominently features the safety instruction:  
   > *"Stop immediately if you experience pain or discomfort and follow your clinician's guidance."*

---

## 2. Standardized Language Guidelines

To prevent inappropriate clinical claims or false reassurance, the platform enforces strict terminology boundaries across all user interfaces:

| Prohibited Language | Approved Neutral Phrasing | Rationale |
| :--- | :--- | :--- |
| "You are injured" | "Your movement is outside the prescribed range" | Avoids unauthorized diagnosis |
| "This exercise is medically safe" | "Prescribed by your therapist" | Avoids liability / medical guarantee |
| "You have recovered 40%" | "Movement range trend: +18% ROM" | Quantifies kinematics, not pathology |
| "AI Doctor" / "AI Physiotherapist" | "Camera-Assisted Rehabilitation Coach" | Prevents deceptive persona |
| "Push through the pain" | "Stop if you experience pain or discomfort" | Protects patient safety |

---

## 3. The Confidence Gate: Patient Safety Differentiator

Most commercial motion applications generate continuous form advice even when limbs are occluded or lighting is poor. This creates two clinical hazards:
1. **False Positives**: Patient receives unwarranted praise despite executing incorrect or compensatory movements.
2. **False Frustration**: Patient is penalized because the camera dropped tracking.

RehabSense solves this with an unconditional **Confidence Gate**:
- When landmark visibility or tracking certainty drops below **75%**, form evaluation freezes immediately.
- The interface displays an amber alert: *"Movement analysis paused — Please make sure your full body is visible."*
- Repetition counting and angle scoring are suspended until optimal framing is restored.

---

## 4. Privacy & Biometric Protection

- **No Raw Video Persistence**: All camera streams are processed frame-by-frame directly in browser WebAssembly / WebGL memory. No video files or images are stored or transmitted.
- **Structured Telemetry Only**: Telemetry stored on the backend is strictly limited to numeric coordinates, joint angles, repetition timestamps, and quality flags.
