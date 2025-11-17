# Adaptive Mobile Interface for Color-Vision Deficiency (CVD)

High-fidelity iOS-style prototype specification for an ACM CHI research artifact that demonstrates adaptive color rendering, personalized CVD support, and task-based evaluation.

## Global Visual + Interaction System
- **Theme**: Light, neutral background (#F6F7FB) with 18–22 px rounded cards, drop-shadow `0 12px 24px rgba(0,0,0,0.08)`.
- **Typography**: SF Pro Display for titles (32/28/24 pt) and SF Pro Text for body (17 pt), 1.3 line height.
- **Controls**: Filled inputs with 2 px outlines (#D4D8E2). Primary buttons: pill-shaped (#1E63F7) with white text, secondary (#E5E9F6) dark text.
- **Iconography**: Minimal, outline icons only when necessary.
- **Accessibility**: All color contrasts ≥ 4.5:1; dynamic text labels accompany color-only cues.
- **Illustrations**: Simple gradient backgrounds to highlight Landolt-C symbol and color wheel.

### App Flow Overview
`Onboarding → Cone Contrast Test → CVD Color Profile → Randomized Condition → Task Set (Tiles, Scroll, Cards) → Stats Summary → Export`

### Screen Connection Annotations
1. Onboarding CTA “Begin Cone Contrast Test” navigates to CCT screen.
2. “Generate My Adaptive Color Profile” transitions to personalized palette.
3. “Start Tasks” opens Randomized Condition selector; screen displays assignment card.
4. “Start Task Set” opens Task Deck: Tile Picking → Color Scrolling → Card Matching. Each task has tabs to toggle **Condition A (iOS filter)** vs **Condition B (AUI)**, determined by assignment order.
5. Completing both versions unlocks Stats Summary; “Export Study Data” outputs CSV/JSON bundle.

---

## Screen 1: Onboarding — Participant Intake
**Caption (CHI System Section)**: “Adaptive UI captures demographic + usage traits for calibration.”

| Area | Spec |
| --- | --- |
| Layout | Split card on light background. Upper third houses title “Adaptive CVD Study”; lower card hosts form. |
| Inputs | Name (rounded text field), Age (numeric field with +/- steppers), CVD Type dropdown (Protanomaly, Deuteranomaly, Tritanomaly, Achromatopsia) using large chevron, Screen Time slider (0–80 hrs). |
| CTA | Primary button “Begin Cone Contrast Test” spans card width; ghost button “Review Study Details”. |
| Accessibility | Helper text: “Data stored securely for research use only.” |

---

## Screen 2: Cone Contrast Test (CCT)
**Caption (CHI System Section)**: “Mobile Landolt-C cone contrast calibration replicates clinical CCT.”

- **Hero area**: Neutral gradient frame with centered Landolt-C ring (white stroke 6 px) on tinted background. Gap orientation rotates up/down/left/right per trial.
- **Interaction**: Four ghost buttons arranged crosswise (↑, ↓, ←, →). Haptics confirm selection.
- **Calibration bars**: Horizontal segmented bars for Red (L), Green (M), Blue (S) with gradient intensity slider; dynamic numeric % readouts below (0–100%).
- **Progress indicator**: 12-step dots at top.
- **Data capture**: After final trial, card summary shows L/M/S cone sensitivity (e.g., L 58%, M 34%, S 76%).
- **CTA**: “Generate My Adaptive Color Profile”. Secondary: “Retake CCT”.

---

## Screen 3: Personalized CVD Color Palette
**Caption (CHI System Section)**: “System derives individualized palette shifts from cone sensitivity.”

| Component | Description |
| --- | --- |
| Header | Title “Your CVD Color Profile” with user name + CVD type chip (e.g., “Deuteranomaly”). |
| Visualization | Circular color wheel segmented into 12 hues; active sectors display adjusted hues. Inner ring demonstrates neutral grays unaffected by shift. |
| Controls | Three sliders for Red shift, Green shift, Blue shift; values auto-populated from CCT sensitivities (e.g., +12°, -8°, +5°). Each slider includes mini preview gradient. |
| Explanation | Text block: “Reduced M-cone response shifts greens toward warmer spectrum; adaptive palette compensates with +12% saturation.” |
| CTA | “Start Tasks” button anchored bottom. |

---

## Screen 4: Randomized Condition Assignment
**Caption (CHI Evaluation Section)**: “Experiment engine randomizes baseline (iOS filter) vs adaptive interface order.”

- **Mechanism**: On tap, animated shuffle card toggles between Condition A (iOS Color Filters) and Condition B (Adaptive UI). RNG ensures counterbalancing.
- **Current assignment card**: Rounded tile with icon + copy, e.g., “You will complete iOS Color Filters first.” Subtext: “System will automatically swap after Task 3.”
- **CTA**: “Start Task Set”. Secondary link: “Why two conditions?” opens modal explanation.

---

## Task Suite Overview
Each task screen uses a segmented control at top to display Condition label (A/B) plus color-coded pill (A: neutral gray, B: adaptive teal). Metrics (Time, Accuracy, Swipes) pinned beneath header. Buttons to swap between iOS filter visualization (static) and Adaptive palette (personalized) appear when participant’s randomized order requires it.

### Task 1: Tile Picking — Time + Accuracy
**Caption (CHI Evaluation Section)**: “Tile selection highlights improved discriminability with adaptive palette.”

- **Layout**: Top card shows target swatch with hex code and textual label (“Target: Muted cyan #6ACFD9”). Timer and accuracy counters sit adjacent.
- **Grid**: 5×5 rounded squares (64 px). iOS filter version uses default iOS color filter effect (e.g., Deuteranopia filter). AUI version offsets each tile hue and saturation per L/M/S data, increasing inter-color distance.
- **Interaction**: Tap once to select; selection ring thickens. Feedback label “Correct/Incorrect” with haptic pulse.
- **Metrics**: `Time to first tap`, `Correctness`, `Retries` logged.

### Task 2: Color Scrolling — Swipes + Time
**Caption**: “Scrollable palette demonstrates adaptive spacing for color search.”

- **Hero**: Large target swatch + textual descriptor (“Find: Cool mauve 42”).
- **Palette**: Horizontally scrollable row of 18 capsules. iOS version: tightly spaced subtle differences. AUI: normalized spacing using user’s deficit profile to maximize differentiability.
- **Controls**: Swipe counter overlay in upper-right; timer below target.
- **Action**: Tap capsule to confirm; confirm button disabled until selection.
- **Metrics**: `Swipe count`, `Selection time`, `Delta from target` (DeltaE).

### Task 3: Card Matching — Memory Time + Accuracy
**Caption**: “Adaptive saturation improves color-coded memory pairs.”

- **Grid**: 4×3 cards with soft drop shadows. Colors paired via background and icon pairings.
- **iOS Filter version**: Colors use standard palette passed through chosen iOS filter.
- **AUI version**: Adjusted saturation/lightness to ensure target pairs differ by ≥ 26 in DeltaE, plus subtle icon difference for reinforcement.
- **HUD**: Timer top center, error count top right. Progress indicator counts matched pairs.

---

## Screen 6: Stats Summary Dashboard
**Caption (CHI Evaluation Section)**: “Dashboard compares baseline vs adaptive performance metrics.”

- **Header**: “Study Results” with participant ID and condition order summary.
- **Metrics cards**:
  - Average completion time (dual-value bar, e.g., iOS 38.4s vs AUI 27.1s).
  - Swipe count comparison (line chart across tasks).
  - Accuracy comparison (radar chart: Tile/Scroll/Card). Colors: iOS gray, AUI teal.
- **NASA-TLX**: If participant completed TLX survey, list mental/physical/temporal demand bars.
- **Preference**: Likert slider (1–7) summarizing “Preferred Interface”; icon indicates leaning.
- **Qualitative notes**: Multiline field “Additional comments”.
- **CTA**: “Export Study Data” button (fills CSV + JSON). Secondary “Schedule Next Participant”.

---

## Data + Logging Notes
- Every interaction logs timestamp, task condition, CCT profile snapshot, and device brightness.
- Export payload contains per-task metrics, NASA-TLX responses, and qualitative notes for CHI reproducibility.

## Color Simulation Guidelines
- Provide palette presets for each CVD type; previews show triad of colors demonstrating Protan/Deutan/Tritan adjustments.
- Adaptive UI uses LMS-based matrix to remap hues; include tooltip in palette screen describing transformation percentages.

## CHI Paper Placement Notes
- **System Section**: Highlight Screens 1–4 for personalization pipeline.
- **Evaluation Section**: Include Task screens + Stats Summary, referencing recorded metrics.
- Short captions provided above for figure inclusion.

