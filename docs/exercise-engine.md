# RehabSense Exercise Engine Documentation

The **RehabSense Exercise Engine** (`@rehabsense/exercise-engine`) is a deterministic, rule-based kinematic movement analysis engine executing browser-side.

---

## 1. Joint Angle Calculation

Joint angles are computed between three 2D/3D landmarks using vector algebra at vertex $B$ formed by vectors $\vec{BA} = A - B$ and $\vec{BC} = C - B$:

$$\cos \theta = \frac{\vec{BA} \cdot \vec{BC}}{\|\vec{BA}\| \|\vec{BC}\|}$$

$$\theta = \arccos\left(\text{clamp}(\cos \theta, -1.0, 1.0)\right) \times \frac{180}{\pi}$$

### Joint Mappings (MediaPipe Pose 33-Landmark Standard)
- **Elbow Flexion**:
  - Point A: `left_shoulder` (11)
  - Vertex B: `left_elbow` (13)
  - Point C: `left_wrist` (15)
- **Shoulder Flexion**:
  - Point A: `left_hip` (23)
  - Vertex B: `left_shoulder` (11)
  - Point C: `left_elbow` (13)
- **Sit-to-Stand**:
  - Point A: `left_hip` (23)
  - Vertex B: `left_knee` (25)
  - Point C: `left_ankle` (27)

---

## 2. Confidence Gate & Occlusion Filter

### Gate Inputs
1. `visibility`: MediaPipe landmark prediction confidence $[0.0, 1.0]$ for each required joint.
2. `boundaryBounds`: Ensures joints are not clipped at the camera viewport edge ($0.02 < x < 0.98$ and $0.02 < y < 0.98$).
3. `smoothedConfidence`: Exponential moving average $\bar{C}_t = \alpha C_t + (1 - \alpha) \bar{C}_{t-1}$ to filter single-frame flutter.

### Gate Evaluation
- **Passing State**: All required landmarks have visibility $\ge 0.70$ and smoothed confidence $\ge 0.75$. Form evaluation proceeds normally.
- **Gated State**: If any critical joint is obscured or overall confidence drops below threshold:
  - Form feedback and rep incrementing are immediately frozen.
  - An amber HUD banner displays: *"Movement analysis paused — Please make sure your full body is visible."*
  - The system specifies the exact obscured joints (e.g., *"Required joints obscured: left wrist"*).

---

## 3. Repetition State Machine (with Hysteresis)

```
       +--------------+
       |     REST     |  (Arm extended ~155°)
       +--------------+
              |
              | Angle drops past (startAngle - hysteresisBuffer)
              v
       +--------------+
       |    MOVING    |  (Flexion initiated)
       +--------------+
              |
              | Angle reaches prescribed target (e.g. <= 120°)
              v
       +--------------+
       | TARGET_ZONE  |  (Peak ROM recorded, prompt return)
       +--------------+
              |
              | Angle increases back past returnAngle (e.g. >= 145°)
              v
       +--------------+
       |  COMPLETED   |  (Increment rep count, evaluate validity)
       +--------------+
              |
              v (Auto reset)
            [REST]
```

### Debouncing & Validity
- A repetition is only marked `isValid = true` if the peak ROM achieved satisfied the therapist's prescribed window:
  $$\text{Peak ROM} \le \text{Target ROM} + \text{Tolerance}$$
- If a patient reverses motion before reaching the target (e.g., stops at $108^\circ$ when target is $120^\circ$), the rep is flagged with `range_below_target` for therapist review.

---

## 4. Kinematic Simulation Engine

To ensure rock-solid resilience during live hackathon demonstrations and when webcams are unavailable, the engine includes a deterministic simulator (`KinematicSimulationEngine`). It emits 33 standardized landmarks supporting 3 scenarios:
1. `NORMAL_REPS`: Smooth cyclical reps peaking at $122^\circ$ (passing target).
2. `UNDER_RANGE_REP`: Reversible under-range reps peaking at $108^\circ$ (triggers clinician review flag).
3. `LOW_CONFIDENCE`: Drops landmark visibility to $0.55$ to demonstrate the Confidence Gate pausing live on stage.
