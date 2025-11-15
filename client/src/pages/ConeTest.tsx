import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';
import { ConeTestResult, ConeMetrics } from '../../../shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { thresholdFromFixedLevels } from '@/lib/staircaseThreshold';

type Direction = 'left' | 'up' | 'right' | 'down';
type ConeType = 'L' | 'M' | 'S';

interface Trial {
  coneType: ConeType;
  direction: Direction;
  contrastPercent: number;
  responseTimeMs: number;
  correct: boolean;
}

interface TestPhase {
  coneType: ConeType;
  label: string;
  color: string;
}

const TEST_PHASES: TestPhase[] = [
  { coneType: 'L', label: 'Red (L-cone)', color: '#ff6b6b' },
  { coneType: 'M', label: 'Green (M-cone)', color: '#51cf66' },
  { coneType: 'S', label: 'Blue (S-cone)', color: '#4dabf7' },
];

const TRIALS_PER_CONE = 6;
const CONTRAST_LEVELS = [1, 5, 10, 25, 50, 100]; // Fixed contrast levels
const C_RADIUS = 30;          // size of the C (smaller)
const C_STROKE = 12;          // thickness of the ring
const GAP_FRACTION = 0.18;    // fraction of the circle to leave open (≈ 65°)

const circumference = 2 * Math.PI * C_RADIUS;
const gapLength = circumference * GAP_FRACTION;
const visibleLength = circumference - gapLength;

export default function ConeTest() {
  const { updateConeTestResult, nextStep } = useApp();
  const [, setLocation] = useLocation();
  
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentDirection, setCurrentDirection] = useState<Direction>('right');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [trialStartTime, setTrialStartTime] = useState<number>(0);
  const [isStarted, setIsStarted] = useState(false);
  const [showStimulus, setShowStimulus] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<ConeTestResult | null>(null);

  const currentPhase = TEST_PHASES[currentPhaseIndex];
  const totalTrials = TRIALS_PER_CONE * TEST_PHASES.length;
  const completedTrials = trials.length;
  const progress = (completedTrials / totalTrials) * 100;

  const getRandomDirection = useCallback((): Direction => {
    const directions: Direction[] = ['left', 'up', 'right', 'down'];
    return directions[Math.floor(Math.random() * directions.length)];
  }, []);

  const getRotation = (direction: Direction): number => {
    switch (direction) {
      case 'right': return 0;
      case 'down': return 90;
      case 'left': return 180;
      case 'up': return 270;
    }
  };

  const getStimulusColor = (coneType: ConeType, contrastPercent: number): string => {
    const gray = 128;
    const contrastValue = Math.round((contrastPercent / 100) * 127);
    
    switch (coneType) {
      case 'L':
        return `rgb(${gray + contrastValue}, ${gray}, ${gray})`;
      case 'M':
        return `rgb(${gray}, ${gray + contrastValue}, ${gray})`;
      case 'S':
        return `rgb(${gray}, ${gray}, ${gray + contrastValue})`;
    }
  };

  const startNewTrial = useCallback(() => {
    const direction = getRandomDirection();
    setCurrentDirection(direction);
    setShowStimulus(true);
    setTrialStartTime(Date.now());
  }, [getRandomDirection]);

  const handleDirectionClick = (selectedDirection: Direction) => {
    if (isProcessing || !showStimulus) return;
    
    setIsProcessing(true);
    setShowStimulus(false);
    
    const responseTime = Date.now() - trialStartTime;
    const isCorrect = selectedDirection === currentDirection;
    const currentContrast = CONTRAST_LEVELS[currentTrial];
    
    const trial: Trial = {
      coneType: currentPhase.coneType,
      direction: currentDirection,
      contrastPercent: currentContrast,
      responseTimeMs: responseTime,
      correct: isCorrect,
    };
    setTrials(prev => [...prev, trial]);

    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);

      if (currentTrial + 1 >= TRIALS_PER_CONE) {
        if (currentPhaseIndex + 1 < TEST_PHASES.length) {
          setCurrentPhaseIndex(prev => prev + 1);
          setCurrentTrial(0);
          setTimeout(() => {
            setIsProcessing(false);
            startNewTrial();
          }, 1000);
        } else {
          calculateAndSaveResults([...trials, trial]);
        }
      } else {
        setCurrentTrial(prev => prev + 1);
        setTimeout(() => {
          setIsProcessing(false);
          startNewTrial();
        }, 500);
      }
    }, 600);
  };

  const calculateConeMetrics = (coneTrials: Trial[]): ConeMetrics => {
    const n = coneTrials.length;
    
    // Extract contrast levels and responses for threshold calculation
    const contrastLevels = coneTrials.map(t => t.contrastPercent);
    const responses = coneTrials.map(t => t.correct);
    
    // Calculate threshold using staircase algorithm adapted for fixed levels
    const threshold = thresholdFromFixedLevels(contrastLevels, responses);
    
    // Calculate standard error based on response variability
    const correctCount = responses.filter(r => r).length;
    const proportion = correctCount / n;
    // Standard error for proportion: sqrt(p(1-p)/n)
    const stdError = Math.sqrt(proportion * (1 - proportion) / n) * 100;
    
    const avgTime = coneTrials.reduce((sum, t) => sum + t.responseTimeMs, 0) / coneTrials.length / 1000;
    const thresholdDecimal = threshold / 100;
    const logCS = Math.log10(1 / Math.max(0.0001, thresholdDecimal));
    const score = Math.round(Math.min(200, Math.max(0, logCS * 75)));
    
    let category: "Normal" | "Possible" | "Deficient" = "Normal";
    if (threshold > 10 || score < 80) category = "Possible";
    if (threshold > 25 || score < 50) category = "Deficient";
    
    return {
      threshold: Number(threshold.toFixed(2)),
      stdError: Number(stdError.toFixed(2)),
      trials: coneTrials.length,
      avgTime: Number(avgTime.toFixed(1)),
      logCS: Number(logCS.toFixed(2)),
      score,
      category,
    };
  };

  const calculateAndSaveResults = async (allTrials: Trial[]) => {
    const L = calculateConeMetrics(allTrials.filter(t => t.coneType === 'L'));
    const M = calculateConeMetrics(allTrials.filter(t => t.coneType === 'M'));
    const S = calculateConeMetrics(allTrials.filter(t => t.coneType === 'S'));

    let detectedType: 'protan' | 'deutan' | 'tritan' | 'normal' = 'normal';
    if (L.category !== "Normal" && L.threshold > M.threshold && L.threshold > S.threshold) {
      detectedType = 'protan';
    } else if (M.category !== "Normal" && M.threshold > L.threshold && M.threshold > S.threshold) {
      detectedType = 'deutan';
    } else if (S.category !== "Normal" && S.threshold > L.threshold && S.threshold > M.threshold) {
      detectedType = 'tritan';
    }

    const result: ConeTestResult = { L, M, S, detectedType };
    setResults(result);
    setShowResults(true);
    await updateConeTestResult(result);
  };

  const handleStart = () => {
    setIsStarted(true);
    startNewTrial();
  };

  const handleContinue = () => {
    nextStep();
    setLocation('/cvd-results');
  };

  const handleSkipTest = async () => {
    // Generate fake results for testing
    const cvdTypes = ['protan', 'deutan', 'tritan', 'normal'] as const;
    const randomType = cvdTypes[Math.floor(Math.random() * cvdTypes.length)];
    
    // Generate realistic-looking fake metrics based on CVD type
    const generateFakeMetrics = (isDeficient: boolean): ConeMetrics => {
      const threshold = isDeficient ? 15 + Math.random() * 25 : 3 + Math.random() * 7;
      const thresholdDecimal = threshold / 100;
      const logCS = Math.log10(1 / Math.max(0.0001, thresholdDecimal));
      const score = Math.round(Math.min(200, Math.max(0, logCS * 75)));
      
      let category: "Normal" | "Possible" | "Deficient" = "Normal";
      if (threshold > 10 || score < 80) category = "Possible";
      if (threshold > 25 || score < 50) category = "Deficient";
      
      return {
        threshold: Number(threshold.toFixed(2)),
        stdError: Number((Math.random() * 3).toFixed(2)),
        trials: 6,
        avgTime: Number((1.2 + Math.random() * 0.8).toFixed(1)),
        logCS: Number(logCS.toFixed(2)),
        score,
        category,
      };
    };

    const L = generateFakeMetrics(randomType === 'protan');
    const M = generateFakeMetrics(randomType === 'deutan');
    const S = generateFakeMetrics(randomType === 'tritan');

    const result: ConeTestResult = { L, M, S, detectedType: randomType };
    await updateConeTestResult(result);
    setResults(result);
    setShowResults(true);
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-2xl" data-testid="card-cone-test-intro">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle data-testid="text-title">Cone Contrast Sensitivity Test</CardTitle>
                <CardDescription data-testid="text-description">
                  Quick contrast detection test for Red, Green, and Blue/Violet
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold">How it works:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>A <strong>C</strong> ring will appear with a gap on one side</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Click the button that matches where you see the gap</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>6 trials per color at different contrast levels (1%, 5%, 10%, 25%, 50%, 100%)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Total time: ~5 minutes (18 trials)</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Test phases:</h3>
              <div className="grid gap-2">
                {TEST_PHASES.map((phase, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: phase.color }}
                    />
                    <span className="text-sm">{phase.label}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{TRIALS_PER_CONE} trials</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleStart} 
                className="flex-1"
                size="lg"
                data-testid="button-start-test"
              >
                <Eye className="mr-2 h-5 w-5" />
                Start Test
              </Button>
              <Button 
                onClick={handleSkipTest} 
                variant="outline"
                size="lg"
                data-testid="button-skip-test"
              >
                Skip (Debug)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="min-h-screen p-4 bg-background">
        <div className="max-w-4xl mx-auto space-y-4">
          <Card data-testid="card-results">
            <CardHeader>
              <CardTitle data-testid="text-results-title">Test Results</CardTitle>
              <CardDescription data-testid="text-results-description">
                Detected: <span className="font-semibold capitalize">{results.detectedType}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4 text-sm">Contrast Thresholds</h3>
                <div className="space-y-4">
                  {([
                    { type: 'L', label: 'Red (L-cone)', data: results.L, color: '#ff6b6b' },
                    { type: 'M', label: 'Green (M-cone)', data: results.M, color: '#51cf66' },
                    { type: 'S', label: 'Blue (S-cone)', data: results.S, color: '#4dabf7' },
                  ] as const).map(({ type, label, data, color }) => (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{label}</span>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Threshold: <span className="font-mono">{data.threshold}%</span></span>
                          <span className="font-semibold">{data.category}</span>
                        </div>
                      </div>
                      <div className="h-8 bg-muted rounded-lg relative overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, (data.threshold / 30) * 100)}%`,
                            backgroundColor: color,
                            opacity: 0.8,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm">Detailed Metrics</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" data-testid="table-metrics">
                    <thead className="border-b">
                      <tr className="text-muted-foreground">
                        <th className="text-left p-2">Cone</th>
                        <th className="text-right p-2">Threshold</th>
                        <th className="text-right p-2">Std Error</th>
                        <th className="text-right p-2">Trials</th>
                        <th className="text-right p-2">Avg Time</th>
                        <th className="text-right p-2">LogCS</th>
                        <th className="text-right p-2">Score</th>
                        <th className="text-right p-2">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([
                        { label: 'Red L', data: results.L },
                        { label: 'Green M', data: results.M },
                        { label: 'Blue S', data: results.S },
                      ]).map(({ label, data }) => (
                        <tr key={label} className="border-b">
                          <td className="p-2 font-medium">{label}</td>
                          <td className="text-right p-2 font-mono">{data.threshold}%</td>
                          <td className="text-right p-2 font-mono">{data.stdError}%</td>
                          <td className="text-right p-2">{data.trials}</td>
                          <td className="text-right p-2 font-mono">{data.avgTime}s</td>
                          <td className="text-right p-2 font-mono">{data.logCS}</td>
                          <td className="text-right p-2 font-mono">{data.score}</td>
                          <td className="text-right p-2">{data.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-4">
                  Lower threshold = better sensitivity. LogCS &gt; 2.0 is excellent, 1.0-2.0 is normal.
                </p>
                <Button 
                  onClick={handleContinue} 
                  className="w-full"
                  size="lg"
                  data-testid="button-continue"
                >
                  Continue to Color Adjustment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar at top */}
      <div className="w-full p-4 border-b bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="font-medium" data-testid="text-phase">
              {currentPhase.label}
            </span>
            <span className="text-muted-foreground" data-testid="text-trial">
              Trial {currentTrial + 1} / {TRIALS_PER_CONE}
            </span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {completedTrials} / {totalTrials} total
          </div>
        </div>
      </div>

      {/* Main test area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        {/* Gray stimulus panel */}
        <div className="relative w-full max-w-2xl aspect-[4/3]" style={{ backgroundColor: '#AAAAAA' }} data-testid="stimulus-panel">

          {/* Landolt C Stimulus */}
          {showStimulus && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              data-testid="stimulus-landolt-c"
            >
              <svg width="180" height="180" viewBox="0 0 180 180">
                {/* Landolt C rotated to align gap with tick marks */}
                <g transform={`rotate(${getRotation(currentDirection)} 90 90)`}>
                  <circle
                    cx={90}
                    cy={90}
                    r={C_RADIUS}
                    fill="none"
                    stroke={getStimulusColor(currentPhase.coneType, CONTRAST_LEVELS[currentTrial])}
                    strokeWidth={C_STROKE}
                    strokeLinecap="butt"
                    strokeDasharray={`${visibleLength} ${gapLength}`}
                    strokeDashoffset={-gapLength / 2}
                  />
                </g>

                {/* All 4 tick marks (fixed position, not rotated) */}
                {(() => {
                  const rOuter = C_RADIUS + C_STROKE / 2;
                  const offset = 8;
                  const tickLen = 12;
                  const start = rOuter + offset;
                  const end = start + tickLen;
                  const cx = 90;
                  const cy = 90;
                  const tickColour = "#2f343b";

                  return (
                    <>
                      <line x1={cx} y1={cy - end} x2={cx} y2={cy - start}
                            stroke={tickColour} strokeWidth={2} strokeLinecap="square" />
                      <line x1={cx} y1={cy + start} x2={cx} y2={cy + end}
                            stroke={tickColour} strokeWidth={2} strokeLinecap="square" />
                      <line x1={cx - end} y1={cy} x2={cx - start} y2={cy}
                            stroke={tickColour} strokeWidth={2} strokeLinecap="square" />
                      <line x1={cx + start} y1={cy} x2={cx + end} y2={cy}
                            stroke={tickColour} strokeWidth={2} strokeLinecap="square" />
                    </>
                  );
                })()}
              </svg>
            </div>
          )}

          {/* Feedback */}
          {showFeedback && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="text-4xl font-bold text-green-600">✓</div>
            </div>
          )}
        </div>

        {/* Directional buttons below panel */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
          <div />
          <Button
            onClick={() => handleDirectionClick('up')}
            disabled={!showStimulus || isProcessing}
            variant="outline"
            size="lg"
            className="h-16"
            data-testid="button-up"
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
          <div />
          
          <Button
            onClick={() => handleDirectionClick('left')}
            disabled={!showStimulus || isProcessing}
            variant="outline"
            size="lg"
            className="h-16"
            data-testid="button-left"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div />
          <Button
            onClick={() => handleDirectionClick('right')}
            disabled={!showStimulus || isProcessing}
            variant="outline"
            size="lg"
            className="h-16"
            data-testid="button-right"
          >
            <ArrowRight className="h-6 w-6" />
          </Button>
          
          <div />
          <Button
            onClick={() => handleDirectionClick('down')}
            disabled={!showStimulus || isProcessing}
            variant="outline"
            size="lg"
            className="h-16"
            data-testid="button-down"
          >
            <ArrowDown className="h-6 w-6" />
          </Button>
          <div />
        </div>
      </div>

      {/* Bottom instruction */}
      <div className="p-4 text-center border-t bg-card">
        <p className="text-sm text-muted-foreground">
          Click the button where you see the gap in the C
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Contrast: {CONTRAST_LEVELS[currentTrial]}%
        </p>
      </div>
    </div>
  );
}
