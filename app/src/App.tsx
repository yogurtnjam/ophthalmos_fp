import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import './App.css';
import {
  AdaptiveFilterState,
  applyAdaptiveFilter,
  computeAdaptiveFilter,
  type ConeSensitivity,
  type DifficultySummary,
  defaultDifficulty,
} from './filterModel';

type Step = 'onboarding' | 'cct' | 'profile' | 'condition' | 'tasks' | 'filter' | 'summary';
type ConditionId = 'ios' | 'aui';
type TaskId = 'odd' | 'slider' | 'search';

type OddMetric = {
  reactionTime: number;
  accuracy: number;
  deltaLevel: number;
};

type SliderMetric = {
  time: number;
  swipes: number;
  error: number;
};

type SearchMetric = {
  time: number;
  errors: number;
};

type TaskMetrics = {
  odd?: OddMetric;
  slider?: SliderMetric;
  search?: SearchMetric;
};

type StudyMetrics = Record<ConditionId, TaskMetrics>;

type NasaTlxScores = {
  mental: number;
  effort: number;
  frustration: number;
};

type TaskDefinition = {
  id: TaskId;
  title: string;
  caption: string;
  metricLabels: string;
};

type OddPuzzle = {
  base: string;
  odd: string;
  delta: number;
  target: number;
};

type SearchBoard = {
  colors: string[];
  target: number;
};

const cvdTypes = ['Protanomaly', 'Deuteranomaly', 'Tritanomaly', 'Achromatopsia'];

const taskSequence: TaskDefinition[] = [
  {
    id: 'odd',
    title: 'Task 1 · Odd-Color-Out',
    caption: 'Tap the tile that looks different from the others.',
    metricLabels: 'Reaction time · Accuracy · ΔHSV level',
  },
  {
    id: 'slider',
    title: 'Task 2 · Color Matching Slider',
    caption: 'Drag until the live swatch matches the target sample.',
    metricLabels: 'Time · Swipes · Matching error',
  },
  {
    id: 'search',
    title: 'Task 3 · Visual Search With Distractors',
    caption: 'Find the unique icon among the distractors.',
    metricLabels: 'Search time · False taps',
  },
];

const initialSensitivity: ConeSensitivity = { l: 0.78, m: 0.74, s: 0.58 };

const clamp = (min: number, max: number, value: number) => Math.min(max, Math.max(min, value));
const wrapHue = (value: number) => ((value % 360) + 360) % 360;

const hslToHex = (h: number, s: number, l: number) => {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const hPrime = h / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (hPrime >= 0 && hPrime < 1) {
    r = c;
    g = x;
  } else if (hPrime < 2) {
    r = x;
    g = c;
  } else if (hPrime < 3) {
    g = c;
    b = x;
  } else if (hPrime < 4) {
    g = x;
    b = c;
  } else if (hPrime < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const m = lNorm - c / 2;
  const toHex = (value: number) => {
    const channel = Math.round((value + m) * 255);
    return channel.toString(16).padStart(2, '0');
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const summarizeDifficulty = (records: StudyMetrics): DifficultySummary => {
  const oddAccuracy: number[] = [];
  const sliderErrors: number[] = [];
  const sliderSwipes: number[] = [];
  const searchDifficulty: number[] = [];

  Object.values(records).forEach((condition) => {
    if (condition.odd) {
      oddAccuracy.push(condition.odd.accuracy);
    }
    if (condition.slider) {
      sliderErrors.push(condition.slider.error);
      sliderSwipes.push(condition.slider.swipes / 18);
    }
    if (condition.search) {
      const normalizedTime = condition.search.time / 14;
      const normalizedErrors = condition.search.errors / 6;
      searchDifficulty.push(clamp(0, 1, (normalizedTime + normalizedErrors) / 2));
    }
  });

  if (!oddAccuracy.length && !sliderErrors.length && !searchDifficulty.length) {
    return defaultDifficulty;
  }

  const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

  return {
    accuracy: oddAccuracy.length ? average(oddAccuracy) : defaultDifficulty.accuracy,
    sliderError: sliderErrors.length ? average(sliderErrors) : defaultDifficulty.sliderError,
    sliderSwipes: sliderSwipes.length ? average(sliderSwipes) : defaultDifficulty.sliderSwipes,
    searchDifficulty: searchDifficulty.length ? average(searchDifficulty) : defaultDifficulty.searchDifficulty,
  };
};

const applyForCondition = (color: string, condition: ConditionId, filterState: AdaptiveFilterState) => {
  if (condition === 'aui') {
    return applyAdaptiveFilter(color, filterState);
  }
  return color;
};

const buildColorWheel = (filterState: AdaptiveFilterState) => {
  const palette: { original: string; adapted: string }[] = [];
  for (let hue = 0; hue < 360; hue += 45) {
    const base = hslToHex(hue, 60, 60);
    palette.push({ original: base, adapted: applyAdaptiveFilter(base, filterState) });
  }
  return palette;
import { useMemo, useState } from 'react';
import './App.css';

type Step =
  | 'onboarding'
  | 'cct'
  | 'profile'
  | 'condition'
  | 'tasks'
  | 'summary';

type ConditionId = 'ios' | 'aui';

type TaskId = 'tile' | 'scroll' | 'cards';

type Metric = {
  time: number;
  accuracy: number;
  swipes?: number;
  errors?: number;
};

type ConditionMetrics = Record<TaskId, Metric | null>;

const conditionCards: Record<ConditionId, { title: string; description: string }> = {
  ios: {
    title: 'Condition A · iOS Color Filters',
    description:
      'System-wide color correction mimicking stock iOS filters. Colors are minimally tuned and remain fixed during the tasks.',
  },
  aui: {
    title: 'Condition B · Adaptive Interface',
    description:
      'Dynamic palette tuned from the Cone Contrast Test. Colors, spacing, and saturation shift per user profile during every task.',
  },
};

const taskSequence: { id: TaskId; title: string; prompt: string }[] = [
  { id: 'tile', title: 'Task 1 · Tile Picking', prompt: 'Tap the tile that matches the target swatch.' },
  { id: 'scroll', title: 'Task 2 · Color Scrolling', prompt: 'Scroll to locate the swatch that matches the target sample.' },
  { id: 'cards', title: 'Task 3 · Card Matching', prompt: 'Flip the cards to uncover every matching pair.' },
];

const cvdTypes = ['Protanomaly', 'Deuteranomaly', 'Tritanomaly', 'Achromatopsia'];

const defaultMetrics: ConditionMetrics = {
  tile: null,
  scroll: null,
  cards: null,
};

function App() {
  const [step, setStep] = useState<Step>('onboarding');
  const [participant, setParticipant] = useState({ name: '', age: '', cvdType: cvdTypes[0], screenTime: 28 });
  const [coneSensitivity, setConeSensitivity] = useState<ConeSensitivity>(initialSensitivity);
  const [cctTrials, setCctTrials] = useState<{ orientation: string; success: boolean; contrast: number }[]>([]);
  const [profile, setProfile] = useState({ redShift: 12, greenShift: -8, blueShift: 18 });
  const randomizedConditions = useMemo<ConditionId[]>(() => (Math.random() > 0.5 ? ['ios', 'aui'] : ['aui', 'ios']), []);
  const [conditionIndex, setConditionIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [metrics, setMetrics] = useState<StudyMetrics>({ ios: {}, aui: {} });
  const [taskStartedAt, setTaskStartedAt] = useState<number | null>(null);
  const [taskSubmitted, setTaskSubmitted] = useState(false);
  const [oddPuzzle, setOddPuzzle] = useState<OddPuzzle>({ base: '#f09090', odd: '#f4b0b0', delta: 8, target: 12 });
  const [sliderValue, setSliderValue] = useState(180);
  const [sliderSwipes, setSliderSwipes] = useState(0);
  const [sliderTarget, setSliderTarget] = useState(210);
  const [searchBoard, setSearchBoard] = useState<SearchBoard>({ colors: Array(12).fill('#ccd4ff'), target: 5 });
  const [searchErrors, setSearchErrors] = useState(0);
  const [previewFilter, setPreviewFilter] = useState(false);
  const [showFilterParams, setShowFilterParams] = useState(false);
  const [preferredInterface, setPreferredInterface] = useState<ConditionId>('aui');
  const [likertRating, setLikertRating] = useState(6);
  const [qualitative, setQualitative] = useState('');
  const [nasaTlx, setNasaTlx] = useState<Record<ConditionId, NasaTlxScores>>({
    ios: { mental: 55, effort: 52, frustration: 46 },
    aui: { mental: 38, effort: 32, frustration: 27 },
  });

  const currentCondition = randomizedConditions[conditionIndex];
  const currentTask = taskSequence[currentTaskIndex];

  const difficultySummary = useMemo(() => summarizeDifficulty(metrics), [metrics]);
  const adaptiveFilter = useMemo(
    () => computeAdaptiveFilter(coneSensitivity, difficultySummary),
    [coneSensitivity, difficultySummary]
  );
  const colorWheel = useMemo(() => buildColorWheel(adaptiveFilter), [adaptiveFilter]);

  useEffect(() => {
    if (step !== 'tasks') return;
    setTaskStartedAt(Date.now());
    setTaskSubmitted(false);
    if (currentTask.id === 'odd') {
      const delta = currentCondition === 'aui' ? 18 : 8;
      const target = Math.floor(Math.random() * 36);
      const baseHue = Math.floor(Math.random() * 360);
      setOddPuzzle({
        base: hslToHex(baseHue, 55, 65),
        odd: hslToHex(wrapHue(baseHue + delta), 55, 65),
        delta,
        target,
      });
    }
    if (currentTask.id === 'slider') {
      setSliderTarget(Math.floor(Math.random() * 360));
      setSliderValue(180);
      setSliderSwipes(0);
    }
    if (currentTask.id === 'search') {
      const target = Math.floor(Math.random() * 12);
      const baseHue = Math.floor(Math.random() * 360);
      const colors = Array.from({ length: 12 }, (_, index) =>
        hslToHex(wrapHue(baseHue + (index % 4) * 6), 40, 62)
      );
      colors[target] = hslToHex(wrapHue(baseHue + 32), 65, 60);
      setSearchBoard({ colors, target });
      setSearchErrors(0);
    }
  }, [step, currentTaskIndex, currentCondition, currentTask.id]);

  const weakestCone = useMemo(() => {
    const entries: [keyof ConeSensitivity, number][] = [
      ['l', coneSensitivity.l],
      ['m', coneSensitivity.m],
      ['s', coneSensitivity.s],
    ];
    return entries.sort((a, b) => a[1] - b[1])[0][0];
  }, [coneSensitivity]);

  const sensitivityExplanation = useMemo(() => {
    if (weakestCone === 'l') return 'Protan-like deficits detected. Reds require additional contrast cues.';
    if (weakestCone === 'm') return 'Deutan-like profile. Greens are expanded to avoid overlap with yellows.';
    return 'Tritan-like sensitivity dip. Blues receive boosted saturation.';
  }, [weakestCone]);
  const [participant, setParticipant] = useState({
    name: '',
    age: '',
    cvdType: cvdTypes[0],
    screenTime: 25,
  });
  const [cctTrials, setCctTrials] = useState<{ orientation: string; success: boolean }[]>([]);
  const [coneSensitivity, setConeSensitivity] = useState({ l: 82, m: 78, s: 64 });
  const [profile, setProfile] = useState({ redShift: 12, greenShift: -6, blueShift: 18 });
  const randomizedConditions = useMemo<ConditionId[]>(() => (Math.random() > 0.5 ? ['ios', 'aui'] : ['aui', 'ios']), []);
  const [conditionIndex, setConditionIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [metrics, setMetrics] = useState<Record<ConditionId, ConditionMetrics>>({ ios: { ...defaultMetrics }, aui: { ...defaultMetrics } });
  const [nasaTlx, setNasaTlx] = useState({ ios: 3, aui: 5 });
  const [preferredInterface, setPreferredInterface] = useState<ConditionId>('aui');
  const [qualitative, setQualitative] = useState('');

  const currentCondition = randomizedConditions[conditionIndex];
  const task = taskSequence[currentTaskIndex];

  const taskPalette = useMemo(() => buildPalette(currentCondition, profile), [currentCondition, profile]);

  const handleOnboardingSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setStep('cct');
  };

  const handleCctChoice = (orientation: string) => {
    const success = Math.random() > 0.25;
    const contrast = success ? 0.8 - Math.random() * 0.3 : 0.35 + Math.random() * 0.2;
    setCctTrials((prev) => [...prev, { orientation, success, contrast }].slice(-8));
    setConeSensitivity((prev) => ({
      l: clamp(0.35, 1, prev.l + (success ? 0.03 : -0.02)),
      m: clamp(0.35, 1, prev.m + (success ? 0.028 : -0.018)),
      s: clamp(0.3, 1, prev.s + (success ? 0.025 : -0.02)),
    }));
  };

  const handleTaskComplete = (taskId: TaskId, data: OddMetric | SliderMetric | SearchMetric) => {
    if (taskSubmitted) return;
    setTaskSubmitted(true);
    setMetrics((prev) => ({
      ...prev,
      [currentCondition]: { ...prev[currentCondition], [taskId]: data },
    }));

    if (currentTaskIndex < taskSequence.length - 1) {
      setCurrentTaskIndex((index) => index + 1);
    } else if (conditionIndex < randomizedConditions.length - 1) {
      setCurrentTaskIndex(0);
      setConditionIndex((index) => index + 1);
      setStep('condition');
    } else {
      setStep('filter');
    }
  };

  const recordTime = () => {
    if (!taskStartedAt) return 0;
    return Number(((Date.now() - taskStartedAt) / 1000).toFixed(2));
  };

  const handleOddSelection = (index: number) => {
    const accuracy = index === oddPuzzle.target ? 1 : 0;
    handleTaskComplete('odd', { reactionTime: recordTime(), accuracy, deltaLevel: oddPuzzle.delta });
  };

  const handleSliderSubmit = () => {
    const error = Math.abs(sliderValue - sliderTarget) / 360;
    handleTaskComplete('slider', { time: recordTime(), swipes: sliderSwipes || 1, error: Number(error.toFixed(2)) });
  };

  const handleSearchTap = (index: number) => {
    if (index === searchBoard.target) {
      handleTaskComplete('search', { time: recordTime(), errors: searchErrors });
    } else {
      setSearchErrors((value) => value + 1);
    }
  };

  const handleExport = () => {
    const payload = {
      participant,
      coneSensitivity,
      metrics,
      difficultySummary,
      filter: adaptiveFilter,
      nasaTlx,
      preferredInterface,
      likertRating,
      qualitative,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'adaptive-cvd-study.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const summary = useMemo(() => {
    const avg = (values: (number | undefined)[]) => {
      const filtered = values.filter((value): value is number => typeof value === 'number');
      if (!filtered.length) return 0;
      return Number((filtered.reduce((sum, value) => sum + value, 0) / filtered.length).toFixed(2));
    };

    const reaction = {
      ios: avg([metrics.ios.odd?.reactionTime, metrics.ios.slider?.time, metrics.ios.search?.time]),
      aui: avg([metrics.aui.odd?.reactionTime, metrics.aui.slider?.time, metrics.aui.search?.time]),
    };
    const accuracy = {
      ios: metrics.ios.odd?.accuracy ?? 0,
      aui: metrics.aui.odd?.accuracy ?? 0,
    };
    const slider = {
      ios: metrics.ios.slider?.swipes ?? 0,
      aui: metrics.aui.slider?.swipes ?? 0,
      errors: {
        ios: metrics.ios.slider?.error ?? 0,
        aui: metrics.aui.slider?.error ?? 0,
      },
    };
    const search = {
      ios: metrics.ios.search?.errors ?? 0,
      aui: metrics.aui.search?.errors ?? 0,
    };

    return { reaction, accuracy, slider, search };
  }, [metrics]);

  const buildBarWidth = (value: number) => `${Math.min(100, Math.max(0, value * 20))}%`;

  return (
    <div
      className={`app-shell ${previewFilter ? 'preview-filter' : ''}`}
      style={
        previewFilter
          ? ({ filter: `saturate(${adaptiveFilter.saturationMultiplier.toFixed(2)}) hue-rotate(${adaptiveFilter.hueShiftDeg}deg)` } as CSSProperties)
          : undefined
      }
    >
      <header>
        <p className="eyebrow">Adaptive CVD Study Prototype</p>
        <h1>Adaptive Visual Interface for Color-Vision Deficiency</h1>
        <p className="subtitle">
          Research-grade flow covering onboarding, cone contrast, dual-condition perceptual tasks, adaptive filter modeling, and evaluation dashboards.
        </p>
    const success = Math.random() > 0.3;
    const nextTrials = [...cctTrials, { orientation, success }].slice(-6);
    setCctTrials(nextTrials);
    const l = clamp(60, 100, Math.round(70 + (success ? 8 : -6) + Math.random() * 10));
    const m = clamp(55, 100, Math.round(65 + (success ? 10 : -4) + Math.random() * 12));
    const s = clamp(40, 95, Math.round(55 + (success ? 12 : -10) + Math.random() * 15));
    setConeSensitivity({ l, m, s });
  };

  const handleProfileAdvance = () => {
    setStep('condition');
  };

  const handleConditionAdvance = () => {
    setStep('tasks');
  };

  const handleTaskComplete = (metric: Metric) => {
    setMetrics((prev) => ({
      ...prev,
      [currentCondition]: { ...prev[currentCondition], [task.id]: metric },
    }));
    if (currentTaskIndex < taskSequence.length - 1) {
      setCurrentTaskIndex((prevIdx) => prevIdx + 1);
    } else if (conditionIndex < randomizedConditions.length - 1) {
      setCurrentTaskIndex(0);
      setConditionIndex((idx) => idx + 1);
      setStep('condition');
    } else {
      setStep('summary');
    }
  };

  return (
    <div className="app-shell">
      <header>
        <p className="eyebrow">Adaptive CVD Study Prototype</p>
        <h1>Adaptive Mobile Interface for Color-Vision Deficiency</h1>
        <p className="subtitle">CHI-style prototype demonstrating onboarding, calibration, adaptive palettes, randomized conditions, and per-task metrics.</p>
      </header>

      {step === 'onboarding' && (
        <section className="card">
          <h2>Onboarding · Participant Profile</h2>
          <p className="caption">Collect baseline details for CHI reporting.</p>
          <form className="form-grid" onSubmit={handleOnboardingSubmit}>
            <label>
              Name
              <input type="text" value={participant.name} onChange={(event) => setParticipant({ ...participant, name: event.target.value })} required />
          <p className="caption">Collect baseline details before the cone contrast calibration.</p>
          <form className="form-grid" onSubmit={handleOnboardingSubmit}>
            <label>
              Name
              <input
                type="text"
                value={participant.name}
                onChange={(event) => setParticipant({ ...participant, name: event.target.value })}
                required
              />
            </label>
            <label>
              Age
              <input
                type="number"
                min={5}
                value={participant.age}
                onChange={(event) => setParticipant({ ...participant, age: event.target.value })}
                required
              />
            </label>
            <label>
              CVD Type
              <select value={participant.cvdType} onChange={(event) => setParticipant({ ...participant, cvdType: event.target.value })}>
              <select
                value={participant.cvdType}
                onChange={(event) => setParticipant({ ...participant, cvdType: event.target.value })}
              >
                {cvdTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="full-width">
              Screen Time Per Week · {participant.screenTime} hrs
              <input
                type="range"
                min={5}
                max={80}
                max={70}
                value={participant.screenTime}
                onChange={(event) => setParticipant({ ...participant, screenTime: Number(event.target.value) })}
              />
            </label>
            <button type="submit" className="primary">
              Begin Cone Contrast Test
            </button>
          </form>
        </section>
      )}

      {step === 'cct' && (
        <section className="card">
          <div className="dual-header">
            <div>
              <h2>Cone Contrast Test</h2>
              <p className="caption">Landolt-C calibration for L/M/S estimation.</p>
            </div>
            <button className="ghost" onClick={() => setStep('profile')}>
              Continue to Perception Tasks →
              <p className="caption">Landolt-C calibration with per-orientation logging.</p>
            </div>
            <button className="ghost" onClick={() => setStep('profile')}>
              Skip Simulation
            </button>
          </div>
          <div className="cct-grid">
            <div className="landolt">
              <div className="landolt-cut" />
            </div>
            <div className="orientation-buttons">
              {['Up', 'Right', 'Down', 'Left'].map((orientation) => (
              {['Up', 'Down', 'Left', 'Right'].map((orientation) => (
                <button key={orientation} onClick={() => handleCctChoice(orientation)}>
                  {orientation}
                </button>
              ))}
            </div>
            <div className="calibration-bars">
              <span className="bar red" />
              <span className="bar green" />
              <span className="bar blue" />
            </div>
            <div>
              <p className="eyebrow">Sensitivity Profile</p>
              <div className="bar-chart">
                {(['l', 'm', 's'] as (keyof ConeSensitivity)[]).map((key) => (
                  <div key={key}>
                    <div className="bar-track">
                      <span className="bar-fill" style={{ width: `${Math.round(coneSensitivity[key] * 100)}%` }} />
                    </div>
                    <p className="caption">{key.toUpperCase()}-cone · {Math.round(coneSensitivity[key] * 100)}%</p>
                  </div>
                ))}
              </div>
              <p className="caption">{sensitivityExplanation}</p>
              <button className="secondary" onClick={() => setStep('profile')}>
                Generate My Adaptive Color Profile
              </button>
            </div>
            <div>
              <p className="eyebrow">Recent Trials</p>
              <ul className="trial-log">
                {cctTrials.map((trial, index) => (
                  <li key={`${trial.orientation}-${index}`}>
                    <span>{trial.orientation}</span>
                    <span className={trial.success ? 'success' : 'error'}>{trial.success ? '✓' : '✕'}</span>
                    <span>{Math.round(trial.contrast * 100)}% contrast</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
            <div className="cct-readout">
              <h3>Live Sensitivity Profile</h3>
              <dl>
                <div>
                  <dt>L-cone</dt>
                  <dd>{coneSensitivity.l}%</dd>
                </div>
                <div>
                  <dt>M-cone</dt>
                  <dd>{coneSensitivity.m}%</dd>
                </div>
                <div>
                  <dt>S-cone</dt>
                  <dd>{coneSensitivity.s}%</dd>
                </div>
              </dl>
              <button className="primary" onClick={() => setStep('profile')}>
                Generate My Adaptive Color Profile
              </button>
            </div>
          </div>
          <ul className="trial-log">
            {cctTrials.map((trial, index) => (
              <li key={`${trial.orientation}-${index}`}>
                {trial.orientation} · {trial.success ? 'Correct' : 'Incorrect'}
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 'profile' && (
        <section className="card">
          <h2>Your CVD Color Profile</h2>
          <p className="caption">Tune channel shifts before launching the randomized condition block.</p>
          <div className="profile-grid">
            <div>
              <p className="eyebrow">Personalized Sliders</p>
              {[
                { key: 'redShift', label: 'Red shift', value: profile.redShift },
                { key: 'greenShift', label: 'Green shift', value: profile.greenShift },
                { key: 'blueShift', label: 'Blue shift', value: profile.blueShift },
              ].map(({ key, label }) => (
                <label key={key}>
                  {label} · {profile[key as keyof typeof profile]} pt
          <div className="dual-header">
            <div>
              <h2>Your CVD Color Profile</h2>
              <p className="caption">Personalized palette tuned from the cone contrast test.</p>
            </div>
            <span className="tag">{participant.cvdType}</span>
          </div>
          <div className="profile-grid">
            <div>
              <h3>Channel Shifts</h3>
              {(
                [
                  ['Red shift', 'redShift'],
                  ['Green shift', 'greenShift'],
                  ['Blue shift', 'blueShift'],
                ] as const
              ).map(([label, key]) => (
                <label key={key}>
                  {label} · {profile[key]}%
                  <input
                    type="range"
                    min={-40}
                    max={40}
                    value={profile[key as keyof typeof profile]}
                    onChange={(event) =>
                      setProfile((prev) => ({ ...prev, [key]: Number(event.target.value) }))
                    }
                  />
                </label>
              ))}
            </div>
            <div>
              <p className="eyebrow">Adaptive Palette Preview</p>
              <div className="color-wheel">
                {colorWheel.map((sample, index) => (
                  <div key={index}>
                    <span style={{ background: sample.original }} />
                    <span style={{ background: sample.adapted }} />
                  </div>
                ))}
              </div>
              <p className="caption">Top: default. Bottom: adaptive LMS + HSV adjustments.</p>
            </div>
          </div>
          <button className="primary" onClick={() => setStep('condition')}>
            Continue to Randomized Conditions
          </button>
                    value={profile[key]}
                    onChange={(event) => setProfile({ ...profile, [key]: Number(event.target.value) })}
                  />
                </label>
              ))}
              <p className="note">
                Sliders represent per-channel adjustments applied to both palette generation and icon accents during Adaptive UI
                tasks.
              </p>
              <button className="primary" onClick={handleProfileAdvance}>
                Start Tasks
              </button>
            </div>
            <div className="color-wheel">
              <div className="wheel" style={{ background: buildGradient(profile) }} />
              <p>
                {participant.cvdType} decreases the contrast between long and medium wavelengths. The adaptive palette boosts the
                S-cone channel while compressing reds to avoid confusion.
              </p>
            </div>
          </div>
        </section>
      )}

      {step === 'condition' && (
        <section className="card">
          <h2>Condition Randomization</h2>
          <p className="caption">Participants complete all three tasks under each filter condition.</p>
          <div className="condition-grid">
            {randomizedConditions.map((condition, index) => (
              <div key={condition} className={`condition-card ${index === conditionIndex ? 'active' : ''}`}>
                <p className="eyebrow">Order {index + 1}</p>
                <h3>{condition === 'ios' ? 'Condition A · iOS Color Filters' : 'Condition B · AUI Adaptive Filter'}</h3>
                <p>
                  {condition === 'ios'
                    ? 'System-wide static corrections similar to iOS accessibility filters.'
                    : 'Personalized, per-pixel LMS compensation with HSV spacing tuned by task metrics.'}
                </p>
              </div>
            ))}
          </div>
          <button className="primary" onClick={() => setStep('tasks')}>
            Start Task Set ({currentCondition.toUpperCase()})
          </button>
          <h2>Randomized Condition Selection</h2>
          <p className="caption">Balanced presentation order ensures counterbalancing between iOS filters and Adaptive UI.</p>
          <div className="condition-card">
            <h3>{conditionCards[currentCondition].title}</h3>
            <p>{conditionCards[currentCondition].description}</p>
            <button className="primary" onClick={handleConditionAdvance}>
              Start Task Set
            </button>
          </div>
          <p className="note">Order for this session: {randomizedConditions.map((c) => conditionCards[c].title).join(' → ')}</p>
        </section>
      )}

      {step === 'tasks' && (
        <section className="card">
          <div className="dual-header">
            <div>
              <h2>{currentTask.title}</h2>
              <p className="caption">{currentTask.caption}</p>
              <p className="caption metrics">{currentTask.metricLabels}</p>
            </div>
            <div className="condition-pill">{currentCondition === 'ios' ? 'iOS Filter' : 'Adaptive UI (AUI)'}</div>
          </div>
          {currentTask.id === 'odd' && (
            <div className="task-surface">
              <div className="tile-grid">
                {Array.from({ length: 36 }).map((_, index) => {
                  const color = index === oddPuzzle.target ? oddPuzzle.odd : oddPuzzle.base;
                  const applied = applyForCondition(color, currentCondition, adaptiveFilter);
                  return (
                    <button key={index} style={{ background: applied }} onClick={() => handleOddSelection(index)}>
                      <span className="sr-only">Tile {index + 1}</span>
                    </button>
                  );
                })}
              </div>
              <p className="caption">ΔHSV: {oddPuzzle.delta}° hue shift · tap the unique tile.</p>
            </div>
          )}

          {currentTask.id === 'slider' && (
            <div className="task-surface">
              <div className="swatch-row">
                <div>
                  <p className="eyebrow">Target swatch</p>
                  <div className="swatch" style={{ background: hslToHex(sliderTarget, 65, 55) }} />
                </div>
                <div>
                  <p className="eyebrow">Your match</p>
                  <div
                    className="swatch"
                    style={{ background: applyForCondition(hslToHex(sliderValue, 65, 55), currentCondition, adaptiveFilter) }}
                  />
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={sliderValue}
                onChange={(event) => {
                  setSliderValue(Number(event.target.value));
                  setSliderSwipes((value) => value + 1);
                }}
              />
              <button className="primary" onClick={handleSliderSubmit}>
                Submit Match
              </button>
            </div>
          )}

          {currentTask.id === 'search' && (
            <div className="task-surface">
              <div className="search-grid">
                {searchBoard.colors.map((color, index) => {
                  const applied = applyForCondition(color, currentCondition, adaptiveFilter);
                  return (
                    <button key={index} onClick={() => handleSearchTap(index)}>
                      <span style={{ background: applied }} />
                    </button>
                  );
                })}
              </div>
              <p className="caption">False taps: {searchErrors} · find the unique hue.</p>
            </div>
              <h2>
                {taskSequence[currentTaskIndex].title} · {conditionCards[currentCondition].title}
              </h2>
              <p className="caption">{task.prompt}</p>
            </div>
            <div className="task-status">
              <span>
                Task {currentTaskIndex + 1} / {taskSequence.length}
              </span>
              <span>
                Condition {conditionIndex + 1} / {randomizedConditions.length}
              </span>
            </div>
          </div>
          {task.id === 'tile' && (
            <TileTask palette={taskPalette} onComplete={handleTaskComplete} condition={currentCondition} />
          )}
          {task.id === 'scroll' && (
            <ScrollTask palette={taskPalette} onComplete={handleTaskComplete} condition={currentCondition} />
          )}
          {task.id === 'cards' && (
            <CardTask onComplete={handleTaskComplete} condition={currentCondition} />
          )}
        </section>
      )}

      {step === 'filter' && (
        <section className="card">
          <div className="dual-header">
            <div>
              <h2>Your Adaptive Color Filter</h2>
              <p className="caption">Model composed from CCT sensitivities + task-derived difficulty.</p>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={previewFilter} onChange={(event) => setPreviewFilter(event.target.checked)} />
              Preview All Screens With My Filter
            </label>
          </div>
          <div className="filter-grid">
            <div>
              <p className="eyebrow">LMS Gains</p>
              {(['l', 'm', 's'] as (keyof ConeSensitivity)[]).map((channel) => (
                <div key={channel} className="bar-track">
                  <span className="bar-fill" style={{ width: `${adaptiveFilter.gains[channel] * 50}%` }} />
                  <p className="caption">
                    {channel.toUpperCase()} gain · {adaptiveFilter.gains[channel].toFixed(2)}×
                  </p>
                </div>
              ))}
              <p className="eyebrow">HSV Adjustments</p>
              <ul className="filter-list">
                <li>Saturation boost: {adaptiveFilter.saturationMultiplier.toFixed(2)}×</li>
                <li>Value lift: +{Math.round(adaptiveFilter.valueLift * 100)}%</li>
                <li>Hue separation in red/green band: ±{adaptiveFilter.hueShiftDeg.toFixed(1)}°</li>
              </ul>
            </div>
            <div>
              <p className="eyebrow">Side-by-side Preview</p>
              <div className="preview-row">
                <div>
                  <h4>Default iOS Filter</h4>
                  <div className="preview-card">
                    <div className="swatch" style={{ background: '#c55' }} />
                    <div className="swatch" style={{ background: '#7ac' }} />
                    <div className="swatch" style={{ background: '#fdd35c' }} />
                  </div>
                </div>
                <div>
                  <h4>AUI Adaptive Filter</h4>
                  <div className="preview-card">
                    {['#c55', '#7ac', '#fdd35c'].map((color) => (
                      <div key={color} className="swatch" style={{ background: applyAdaptiveFilter(color, adaptiveFilter) }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button className="primary" onClick={() => setStep('summary')}>
            View Stats Dashboard
          </button>
        </section>
      )}

      {step === 'summary' && (
        <section className="card">
          <h2>Stats & Evaluation Dashboard</h2>
          <p className="caption">Compare performance metrics across conditions and capture subjective ratings.</p>
          <div className="stats-grid">
            <div>
              <h3>Reaction Time (s)</h3>
              <div className="bar-comparison">
                <div>
                  <span>iOS</span>
                  <div className="bar-track">
                    <span className="bar-fill" style={{ width: buildBarWidth(summary.reaction.ios) }} />
                  </div>
                  <p>{summary.reaction.ios}s</p>
                </div>
                <div>
                  <span>AUI</span>
                  <div className="bar-track">
                    <span className="bar-fill accent" style={{ width: buildBarWidth(summary.reaction.aui) }} />
                  </div>
                  <p>{summary.reaction.aui}s</p>
                </div>
              </div>
            </div>
            <div>
              <h3>Accuracy (Task 1)</h3>
              <div className="bar-comparison">
                <div>
                  <span>iOS</span>
                  <div className="bar-track">
                    <span className="bar-fill" style={{ width: `${summary.accuracy.ios * 100}%` }} />
                  </div>
                  <p>{(summary.accuracy.ios * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <span>AUI</span>
                  <div className="bar-track">
                    <span className="bar-fill accent" style={{ width: `${summary.accuracy.aui * 100}%` }} />
                  </div>
                  <p>{(summary.accuracy.aui * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
            <div>
              <h3>Slider Swipes & Error</h3>
              <p className="caption">Lower is better.</p>
              <div className="bar-comparison">
                <div>
                  <span>iOS Swipes</span>
                  <div className="bar-track">
                    <span className="bar-fill" style={{ width: buildBarWidth(summary.slider.ios) }} />
                  </div>
                  <p>{summary.slider.ios}</p>
                </div>
                <div>
                  <span>AUI Swipes</span>
                  <div className="bar-track">
                    <span className="bar-fill accent" style={{ width: buildBarWidth(summary.slider.aui) }} />
                  </div>
                  <p>{summary.slider.aui}</p>
                </div>
              </div>
              <p className="caption">
                Matching error — iOS: {Math.round(summary.slider.errors.ios * 100)}% Δ, AUI: {Math.round(summary.slider.errors.aui * 100)}% Δ
              </p>
            </div>
            <div>
              <h3>Visual Search Errors</h3>
              <div className="bar-comparison">
                <div>
                  <span>iOS</span>
                  <div className="bar-track">
                    <span className="bar-fill" style={{ width: buildBarWidth(summary.search.ios) }} />
                  </div>
                  <p>{summary.search.ios}</p>
                </div>
                <div>
                  <span>AUI</span>
                  <div className="bar-track">
                    <span className="bar-fill accent" style={{ width: buildBarWidth(summary.search.aui) }} />
                  </div>
                  <p>{summary.search.aui}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="tlx-grid">
            {(Object.keys(nasaTlx) as ConditionId[]).map((condition) => (
              <div key={condition}>
                <h3>NASA-TLX · {condition.toUpperCase()}</h3>
                {(['mental', 'effort', 'frustration'] as (keyof NasaTlxScores)[]).map((key) => (
                  <label key={key}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}: {nasaTlx[condition][key]}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={nasaTlx[condition][key]}
                      onChange={(event) =>
                        setNasaTlx((prev) => ({
                          ...prev,
                          [condition]: { ...prev[condition], [key]: Number(event.target.value) },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            ))}
          </div>

          <div className="feedback-grid">
            <label>
              Preferred interface
              <select value={preferredInterface} onChange={(event) => setPreferredInterface(event.target.value as ConditionId)}>
                <option value="ios">iOS Filter</option>
                <option value="aui">Adaptive UI (AUI)</option>
              </select>
            </label>
            <label>
              Preference strength (Likert 1–7): {likertRating}
              <input type="range" min={1} max={7} value={likertRating} onChange={(event) => setLikertRating(Number(event.target.value))} />
            </label>
            <label className="full-width">
              Qualitative comment
              <textarea value={qualitative} onChange={(event) => setQualitative(event.target.value)} placeholder="Describe notable differences, color cues, or workload perception." />
            </label>
          </div>

          <div className="actions-row">
            <button className="secondary" onClick={() => setShowFilterParams((value) => !value)}>
              {showFilterParams ? 'Hide' : 'Show'} Filter Parameters
            </button>
            <button className="primary" onClick={handleExport}>
              Export Results (CSV/JSON)
            </button>
          </div>

          {showFilterParams && (
            <div className="parameter-table">
              <div>
                <p className="eyebrow">Cone sensitivities</p>
                <ul>
                  <li>L: {(coneSensitivity.l * 100).toFixed(0)}%</li>
                  <li>M: {(coneSensitivity.m * 100).toFixed(0)}%</li>
                  <li>S: {(coneSensitivity.s * 100).toFixed(0)}%</li>
                </ul>
              </div>
              <div>
                <p className="eyebrow">Filter parameters</p>
                <ul>
                  <li>gL: {adaptiveFilter.gains.l.toFixed(2)}</li>
                  <li>gM: {adaptiveFilter.gains.m.toFixed(2)}</li>
                  <li>gS: {adaptiveFilter.gains.s.toFixed(2)}</li>
                  <li>S boost: {adaptiveFilter.saturationMultiplier.toFixed(2)}×</li>
                  <li>V lift: +{Math.round(adaptiveFilter.valueLift * 100)}%</li>
                </ul>
              </div>
            </div>
          )}
        </section>
      )}
      {step === 'summary' && (
        <section className="card">
          <h2>Condition Comparison · Study Summary</h2>
          <p className="caption">Aggregate task metrics plus subjective NASA-TLX and qualitative feedback.</p>
          <SummaryDashboard
            metrics={metrics}
            nasaTlx={nasaTlx}
            preferred={preferredInterface}
            qualitative={qualitative}
            onUpdateTlx={setNasaTlx}
            onUpdatePreference={setPreferredInterface}
            onUpdateNote={setQualitative}
          />
        </section>
      )}

      <footer>
        <p>Annotated screens prepared for ACM CHI “System” & “Evaluation” figures. Export ready for lab pilots.</p>
        <button className="ghost">Export Study Data</button>
      </footer>
    </div>
  );
}

function TileTask({
  palette,
  onComplete,
  condition,
}: {
  palette: string[];
  onComplete: (metric: Metric) => void;
  condition: ConditionId;
}) {
  const [targetIndex] = useState(() => Math.floor(Math.random() * palette.length));
  const [startTime] = useState(() => performance.now());

  const handleTileClick = (index: number) => {
    const accuracy = index === targetIndex ? 1 : 0;
    const timeSeconds = (performance.now() - startTime) / 1000;
    onComplete({ time: Number(timeSeconds.toFixed(2)), accuracy, errors: accuracy ? 0 : 1 });
  };

  return (
    <div className="task-grid">
      <div className="target-swatch" style={{ background: palette[targetIndex] }}>
        Target Color · {condition === 'aui' ? 'Adaptive Palette' : 'Static iOS filter'}
      </div>
      <div className="tile-grid">
        {palette.map((color, index) => (
          <button key={color + index} style={{ background: color }} onClick={() => handleTileClick(index)} aria-label={`Tile ${index + 1}`} />
        ))}
      </div>
    </div>
  );
}

function ScrollTask({
  palette,
  onComplete,
  condition,
}: {
  palette: string[];
  onComplete: (metric: Metric) => void;
  condition: ConditionId;
}) {
  const [position, setPosition] = useState(0);
  const [swipes, setSwipes] = useState(0);
  const [targetIndex] = useState(() => Math.floor(Math.random() * palette.length));
  const [startTime] = useState(() => performance.now());

  const handleMove = (direction: number) => {
    setSwipes((count) => count + 1);
    setPosition((prev) => clamp(0, palette.length - 1, prev + direction));
  };

  const handleMatch = () => {
    const accuracy = position === targetIndex ? 1 : 0;
    const timeSeconds = (performance.now() - startTime) / 1000;
    onComplete({ time: Number(timeSeconds.toFixed(2)), accuracy, swipes, errors: accuracy ? 0 : 1 });
  };

  return (
    <div className="scroll-task">
      <div className="target-swatch" style={{ background: palette[targetIndex] }}>
        Target Reference · {condition === 'aui' ? 'Personalized spacing' : 'Baseline spacing'}
      </div>
      <div className="scroll-controls">
        <button onClick={() => handleMove(-1)} aria-label="Previous swatch">
          ←
        </button>
        <div className="scroll-strip">
          {palette.map((color, index) => (
            <div key={color + index} className={`scroll-chip ${index === position ? 'active' : ''}`} style={{ background: color }} />
          ))}
        </div>
        <button onClick={() => handleMove(1)} aria-label="Next swatch">
          →
        </button>
      </div>
      <button className="primary" onClick={handleMatch}>
        Confirm Match · {swipes} swipes
      </button>
    </div>
  );
}

function CardTask({ onComplete, condition }: { onComplete: (metric: Metric) => void; condition: ConditionId }) {
  const handleSimulate = () => {
    const baseTime = condition === 'aui' ? 22 : 31;
    const time = Number((baseTime + Math.random() * 5).toFixed(2));
    const errors = condition === 'aui' ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4) + 1;
    const accuracy = Math.max(0, 1 - errors * 0.05);
    onComplete({ time, accuracy: Number(accuracy.toFixed(2)), errors });
  };

  return (
    <div className="card-task">
      <div className="card-grid">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className={`memory-card ${condition === 'aui' ? 'adaptive' : ''}`}>
            <span />
          </div>
        ))}
      </div>
      <button className="primary" onClick={handleSimulate}>
        Simulate Run · capture time + errors
      </button>
      <p className="note">AUI boosts saturation/lightness pairs to reveal edges; iOS filter remains static.</p>
    </div>
  );
}

function SummaryDashboard({
  metrics,
  nasaTlx,
  preferred,
  qualitative,
  onUpdateTlx,
  onUpdatePreference,
  onUpdateNote,
}: {
  metrics: Record<ConditionId, ConditionMetrics>;
  nasaTlx: Record<ConditionId, number>;
  preferred: ConditionId;
  qualitative: string;
  onUpdateTlx: (value: Record<ConditionId, number>) => void;
  onUpdatePreference: (value: ConditionId) => void;
  onUpdateNote: (value: string) => void;
}) {
  const totals = useMemo(() => summarize(metrics), [metrics]);

  return (
    <div className="summary-grid">
      <div>
        <h3>Objective Metrics</h3>
        <div className="chart">
          {(['tile', 'scroll', 'cards'] as TaskId[]).map((task) => (
            <div key={task}>
              <p className="caption">{taskSequence.find((item) => item.id === task)?.title}</p>
              <div className="bars">
                <Bar label="iOS" value={totals.ios[task]?.time ?? 0} color="#8da2cf" />
                <Bar label="AUI" value={totals.aui[task]?.time ?? 0} color="#5bb6a5" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3>NASA-TLX & Preference</h3>
        {(['ios', 'aui'] as ConditionId[]).map((id) => (
          <label key={id}>
            {conditionCards[id].title}
            <input
              type="range"
              min={1}
              max={7}
              value={nasaTlx[id]}
              onChange={(event) => onUpdateTlx({ ...nasaTlx, [id]: Number(event.target.value) })}
            />
            <span className="range-value">{nasaTlx[id]} workload</span>
          </label>
        ))}
        <label>
          Preferred Interface
          <select value={preferred} onChange={(event) => onUpdatePreference(event.target.value as ConditionId)}>
            <option value="ios">iOS Color Filters</option>
            <option value="aui">Adaptive UI</option>
          </select>
        </label>
        <label>
          Qualitative Comment
          <textarea value={qualitative} onChange={(event) => onUpdateNote(event.target.value)} placeholder="Describe legibility, comfort, or fatigue." />
        </label>
      </div>
      <div>
        <h3>Swipe & Accuracy Comparison</h3>
        <div className="radar">
          <RadarRow label="Accuracy" ios={totals.ios.averageAccuracy} aui={totals.aui.averageAccuracy} />
          <RadarRow label="Swipes" ios={totals.ios.scroll?.swipes ?? 0} aui={totals.aui.scroll?.swipes ?? 0} />
          <RadarRow label="Errors" ios={totals.ios.cards?.errors ?? 0} aui={totals.aui.cards?.errors ?? 0} />
        </div>
      </div>
    </div>
  );
}

const Bar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="bar-row">
    <span>{label}</span>
    <div className="bar-track">
      <span className="bar-fill" style={{ width: `${Math.min(value * 3, 100)}%`, background: color }} />
      <span className="bar-value">{value ? `${value}s` : '—'}</span>
    </div>
  </div>
);

const RadarRow = ({ label, ios, aui }: { label: string; ios: number; aui: number }) => (
  <div className="radar-row">
    <p>{label}</p>
    <div>
      <span className="tag">iOS · {ios || '—'}</span>
      <span className="tag adaptive">AUI · {aui || '—'}</span>
    </div>
  </div>
);

function summarize(metrics: Record<ConditionId, ConditionMetrics>) {
  const totals: Record<ConditionId, ConditionMetrics & { averageAccuracy: number }> = {
    ios: { ...metrics.ios, averageAccuracy: 0 },
    aui: { ...metrics.aui, averageAccuracy: 0 },
  };

  (['ios', 'aui'] as ConditionId[]).forEach((condition) => {
    const values = Object.values(metrics[condition]).filter(Boolean) as Metric[];
    if (values.length) {
      totals[condition].averageAccuracy =
        values.reduce((sum, metric) => sum + metric.accuracy, 0) / values.length;
    }
  });

  return totals;
}

function clamp(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value));
}

function buildPalette(condition: ConditionId, profile: { redShift: number; greenShift: number; blueShift: number }) {
  const baseColors = [
    '#f28f8f',
    '#f5c28c',
    '#f3f59d',
    '#b5e48c',
    '#99d1f2',
    '#bdb2ff',
    '#ffc6ff',
    '#ffadad',
    '#ffd6a5',
    '#caffbf',
    '#9bf6ff',
    '#a0c4ff',
    '#bdb2ff',
    '#fdffb6',
    '#f08080',
    '#f4a460',
    '#f6bd60',
    '#84a59d',
    '#cdb4db',
    '#90dbf4',
    '#fee440',
    '#ff9770',
    '#ffd670',
    '#c8b6ff',
    '#e2afff',
  ];

  if (condition === 'ios') {
    return baseColors;
  }

  return baseColors.map((hex) => shiftColor(hex, profile));
}

function shiftColor(hex: string, profile: { redShift: number; greenShift: number; blueShift: number }) {
  const parsed = hex.replace('#', '');
  const r = parseInt(parsed.slice(0, 2), 16);
  const g = parseInt(parsed.slice(2, 4), 16);
  const b = parseInt(parsed.slice(4, 6), 16);

  const adjust = (value: number, shift: number) => clamp(0, 255, Math.round(value + (shift / 40) * 60));
  const nr = adjust(r, profile.redShift);
  const ng = adjust(g, profile.greenShift);
  const nb = adjust(b, profile.blueShift);

  return `rgb(${nr}, ${ng}, ${nb})`;
}

function buildGradient(profile: { redShift: number; greenShift: number; blueShift: number }) {
  return `conic-gradient(from 90deg, rgb(${220 + profile.redShift}, 120, 130), rgb(120, ${220 + profile.greenShift}, 150), rgb(120, 160, ${210 + profile.blueShift}))`;
}

export default App;
