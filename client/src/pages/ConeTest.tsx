import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';
import { ConeTestResult, ConeMetrics } from '../../../shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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

const TRIALS_PER_CONE = 30;
const INITIAL_CONTRAST = 50; // Start at 50% contrast
const MIN_CONTRAST = 0.01; // Minimum 0.01%
const MAX_CONTRAST = 100; // Maximum 100%

// Adaptive staircase parameters
const CORRECT_STEP_DOWN = 0.7; // Reduce contrast by 30% on correct response
const INCORRECT_STEP_UP = 1.5; // Increase contrast by 50% on incorrect response

export default function ConeTest() {
  const { updateConeTestResult, nextStep } = useApp();
  const [, setLocation] = useLocation();
  
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentDirection, setCurrentDirection] = useState<Direction>('right');
  const [currentContrast, setCurrentContrast] = useState(INITIAL_CONTRAST);
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

  // Generate random direction
  const getRandomDirection = useCallback((): Direction => {
    const directions: Direction[] = ['left', 'up', 'right', 'down'];
    return directions[Math.floor(Math.random() * directions.length)];
  }, []);

  // Get Landolt C rotation based on direction
  const getRotation = (direction: Direction): number => {
    switch (direction) {
      case 'right': return 0;
      case 'down': return 90;
      case 'left': return 180;
      case 'up': return 270;
    }
  };

  // Get stimulus color based on cone type and contrast
  const getStimulusColor = (coneType: ConeType, contrastPercent: number): string => {
    const gray = 128;
    const contrastValue = Math.round((contrastPercent / 100) * 127);
    
    switch (coneType) {
      case 'L': // Red-modulated
        return `rgb(${gray + contrastValue}, ${gray}, ${gray})`;
      case 'M': // Green-modulated
        return `rgb(${gray}, ${gray + contrastValue}, ${gray})`;
      case 'S': // Blue-modulated
        return `rgb(${gray}, ${gray}, ${gray + contrastValue})`;
    }
  };

  // Start new trial
  const startNewTrial = useCallback(() => {
    const direction = getRandomDirection();
    setCurrentDirection(direction);
    setShowStimulus(true);
    setTrialStartTime(Date.now());
  }, [getRandomDirection]);

  // Handle user response
  const handleDirectionClick = (selectedDirection: Direction) => {
    if (isProcessing || !showStimulus) return;
    
    setIsProcessing(true);
    setShowStimulus(false);
    
    const responseTime = Date.now() - trialStartTime;
    const isCorrect = selectedDirection === currentDirection;
    
    // Record trial
    const trial: Trial = {
      coneType: currentPhase.coneType,
      direction: currentDirection,
      contrastPercent: currentContrast,
      responseTimeMs: responseTime,
      correct: isCorrect,
    };
    setTrials(prev => [...prev, trial]);

    // Show brief feedback
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      
      // Adaptive staircase: adjust contrast based on response
      let newContrast = currentContrast;
      if (isCorrect) {
        newContrast = Math.max(MIN_CONTRAST, currentContrast * CORRECT_STEP_DOWN);
      } else {
        newContrast = Math.min(MAX_CONTRAST, currentContrast * INCORRECT_STEP_UP);
      }
      setCurrentContrast(newContrast);

      // Check if phase complete
      if (currentTrial + 1 >= TRIALS_PER_CONE) {
        // Move to next cone type or finish
        if (currentPhaseIndex + 1 < TEST_PHASES.length) {
          setCurrentPhaseIndex(prev => prev + 1);
          setCurrentTrial(0);
          setCurrentContrast(INITIAL_CONTRAST);
          setTimeout(() => {
            setIsProcessing(false);
            startNewTrial();
          }, 1000);
        } else {
          // Test complete - calculate results
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

  // Calculate detailed metrics for each cone type
  const calculateConeMetrics = (coneTrials: Trial[]): ConeMetrics => {
    const correctTrials = coneTrials.filter(t => t.correct);
    const accuracy = correctTrials.length / coneTrials.length;
    
    // Calculate threshold as the average contrast of the last 10 trials (stabilized threshold)
    const lastTrials = coneTrials.slice(-10);
    const n = lastTrials.length;
    const threshold = lastTrials.reduce((sum, t) => sum + t.contrastPercent, 0) / n;
    
    // Calculate standard error properly using sample variance: SE = SD / sqrt(n)
    // Sample variance uses (n-1) denominator (Bessel's correction)
    const sumSquaredDiffs = lastTrials.reduce((sum, t) => {
      const diff = t.contrastPercent - threshold;
      return sum + (diff * diff);
    }, 0);
    const sampleVariance = n > 1 ? sumSquaredDiffs / (n - 1) : 0;
    const stdDev = Math.sqrt(sampleVariance);
    const stdError = n > 1 ? stdDev / Math.sqrt(n) : 0;
    
    // Average response time in seconds
    const avgTime = coneTrials.reduce((sum, t) => sum + t.responseTimeMs, 0) / coneTrials.length / 1000;
    
    // LogCS = log10(1 / threshold_decimal)
    const thresholdDecimal = threshold / 100;
    const logCS = Math.log10(1 / Math.max(0.0001, thresholdDecimal));
    
    // Score: normalized to 0-200 scale (higher is better)
    // Score based on LogCS where 2.0+ is excellent (150-200), 1.0-2.0 is normal (80-150), <1.0 is deficient
    const score = Math.round(Math.min(200, Math.max(0, logCS * 75)));
    
    // Categorize based on threshold and score
    let category: "Normal" | "Possible" | "Deficient" = "Normal";
    if (threshold > 10 || score < 80) {
      category = "Possible";
    }
    if (threshold > 25 || score < 50) {
      category = "Deficient";
    }
    
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

  // Calculate and save final results
  const calculateAndSaveResults = async (allTrials: Trial[]) => {
    const lTrials = allTrials.filter(t => t.coneType === 'L');
    const mTrials = allTrials.filter(t => t.coneType === 'M');
    const sTrials = allTrials.filter(t => t.coneType === 'S');

    const L = calculateConeMetrics(lTrials);
    const M = calculateConeMetrics(mTrials);
    const S = calculateConeMetrics(sTrials);

    // Determine CVD type based on which cone has poorest performance
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
    
    // Save to backend
    await updateConeTestResult(result);
  };

  // Start test
  const handleStart = () => {
    setIsStarted(true);
    startNewTrial();
  };

  // Continue to next step
  const handleContinue = () => {
    nextStep();
    setLocation('/cvd-results');
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-2xl" data-testid="card-cone-test-intro">
          <CardHeader>
            <CardTitle data-testid="text-title">Cone Contrast Sensitivity Test</CardTitle>
            <CardDescription data-testid="text-description">
              This test measures your L, M, and S cone sensitivity using adaptive contrast thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Instructions:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>You will see a Landolt C ring with a gap (opening) on one side</li>
                <li>The ring will be very faint - this is intentional</li>
                <li>Click the arrow button that matches where the gap is located</li>
                <li>The test will automatically adjust difficulty based on your responses</li>
                <li>You will complete 30 trials for each color (Red, Green, Blue)</li>
                <li>Total testing time: approximately 5-7 minutes</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Test Phases:</h3>
              <div className="grid gap-2">
                {TEST_PHASES.map((phase, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded border">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: phase.color }}
                    />
                    <span className="text-sm">{phase.label} - {TRIALS_PER_CONE} trials</span>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleStart} 
              className="w-full"
              size="lg"
              data-testid="button-start-test"
            >
              Start Test
            </Button>
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
              <CardTitle data-testid="text-results-title">Cone Contrast Test Results</CardTitle>
              <CardDescription data-testid="text-results-description">
                Detected Type: <span className="font-semibold capitalize">{results.detectedType}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bar Chart Visualization */}
              <div>
                <h3 className="font-semibold mb-4">Contrast Threshold (%)</h3>
                <div className="space-y-4">
                  {([
                    { type: 'L', label: 'Red (L-cone)', data: results.L, color: '#ff6b6b' },
                    { type: 'M', label: 'Green (M-cone)', data: results.M, color: '#51cf66' },
                    { type: 'S', label: 'Blue (S-cone)', data: results.S, color: '#4dabf7' },
                  ] as const).map(({ type, label, data, color }) => (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span className="font-mono">{data.threshold}%</span>
                      </div>
                      <div className="h-12 bg-muted rounded relative overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, (data.threshold / 30) * 100)}%`,
                            backgroundColor: color,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Category: {data.category} | Score: {data.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Metrics Table */}
              <div>
                <h3 className="font-semibold mb-4">Detailed Metrics</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-metrics">
                    <thead>
                      <tr className="border-b">
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
                          <td className="p-2">{label}</td>
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

              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Lower threshold values indicate better cone sensitivity. 
                  LogCS (Logarithm of Contrast Sensitivity) above 2.0 is excellent, 1.0-2.0 is normal, below 1.0 may indicate deficiency.
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

  // Test in progress
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span data-testid="text-phase">
            Phase {currentPhaseIndex + 1}/3: {currentPhase.label}
          </span>
          <span data-testid="text-trial">
            Trial {currentTrial + 1}/{TRIALS_PER_CONE}
          </span>
        </div>
        <Progress value={progress} className="h-2" data-testid="progress-bar" />
        <div className="text-xs text-muted-foreground mt-1 text-right">
          {completedTrials}/{totalTrials} total trials
        </div>
      </div>

      {/* Stimulus Display */}
      <div className="relative w-full max-w-xl aspect-square flex items-center justify-center bg-[#808080] rounded-lg mb-8">
        {/* Fixation cross */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-400 -translate-y-1/2" />
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400 -translate-x-1/2" />
          </div>
        </div>

        {/* Landolt C Stimulus */}
        {showStimulus && (
          <div 
            className="relative"
            style={{
              width: '120px',
              height: '120px',
              transform: `rotate(${getRotation(currentDirection)}deg)`,
            }}
            data-testid="stimulus-landolt-c"
          >
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="40"
                fill="none"
                stroke={getStimulusColor(currentPhase.coneType, currentContrast)}
                strokeWidth="20"
              />
              <rect
                x="95"
                y="50"
                width="30"
                height="20"
                fill="#808080"
              />
            </svg>
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl font-bold text-white bg-black/50 px-6 py-3 rounded">
              ✓
            </div>
          </div>
        )}
      </div>

      {/* Response Buttons */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        <div /> {/* Empty cell */}
        <Button
          onClick={() => handleDirectionClick('up')}
          disabled={isProcessing || !showStimulus}
          size="lg"
          variant="outline"
          data-testid="button-up"
        >
          ↑ Up
        </Button>
        <div /> {/* Empty cell */}
        
        <Button
          onClick={() => handleDirectionClick('left')}
          disabled={isProcessing || !showStimulus}
          size="lg"
          variant="outline"
          data-testid="button-left"
        >
          ← Left
        </Button>
        <div /> {/* Empty cell */}
        <Button
          onClick={() => handleDirectionClick('right')}
          disabled={isProcessing || !showStimulus}
          size="lg"
          variant="outline"
          data-testid="button-right"
        >
          Right →
        </Button>
        
        <div /> {/* Empty cell */}
        <Button
          onClick={() => handleDirectionClick('down')}
          disabled={isProcessing || !showStimulus}
          size="lg"
          variant="outline"
          data-testid="button-down"
        >
          ↓ Down
        </Button>
        <div /> {/* Empty cell */}
      </div>

      <div className="mt-8 text-sm text-muted-foreground text-center">
        <p>Click the arrow button that matches where the gap in the ring is located</p>
        <p className="text-xs mt-1">Contrast: {currentContrast.toFixed(2)}%</p>
      </div>
    </div>
  );
}
