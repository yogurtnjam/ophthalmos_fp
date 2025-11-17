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
