import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';
import { ConeTestResult, ConeMetrics } from '../../../shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

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

const TRIALS_PER_CONE = 20;
const INITIAL_CONTRAST = 50;
const MIN_CONTRAST = 0.01;
const MAX_CONTRAST = 100;
const CORRECT_STEP_DOWN = 0.7;
const INCORRECT_STEP_UP = 1.5;

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
      
      let newContrast = currentContrast;
      if (isCorrect) {
        newContrast = Math.max(MIN_CONTRAST, currentContrast * CORRECT_STEP_DOWN);
      } else {
        newContrast = Math.min(MAX_CONTRAST, currentContrast * INCORRECT_STEP_UP);
      }
      setCurrentContrast(newContrast);

      if (currentTrial + 1 >= TRIALS_PER_CONE) {
        if (currentPhaseIndex + 1 < TEST_PHASES.length) {
          setCurrentPhaseIndex(prev => prev + 1);
          setCurrentTrial(0);
          setCurrentContrast(INITIAL_CONTRAST);
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
    const lastTrials = coneTrials.slice(-10);
    const n = lastTrials.length;
    const threshold = lastTrials.reduce((sum, t) => sum + t.contrastPercent, 0) / n;
    
    const sumSquaredDiffs = lastTrials.reduce((sum, t) => {
      const diff = t.contrastPercent - threshold;
      return sum + (diff * diff);
    }, 0);
    const sampleVariance = n > 1 ? sumSquaredDiffs / (n - 1) : 0;
    const stdDev = Math.sqrt(sampleVariance);
    const stdError = n > 1 ? stdDev / Math.sqrt(n) : 0;
    
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

  // Handle clicking on different regions of the C panel
  const handlePanelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!showStimulus || isProcessing) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Determine which quadrant was clicked
    const dx = x - centerX;
    const dy = y - centerY;
    
    let clickedDirection: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      clickedDirection = dx > 0 ? 'right' : 'left';
    } else {
      clickedDirection = dy > 0 ? 'down' : 'up';
    }

    handleDirectionClick(clickedDirection);
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
                  Professional-grade adaptive threshold detection
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
                  <span>You'll see a <strong>C</strong> shape with a gap (opening) on one side</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Click directly on the side of the C where the gap appears</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>The test adapts in real-time based on your responses</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>20 trials for each color (Red, Green, Blue) = ~5 minutes total</span>
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

            <Button 
              onClick={handleStart} 
              className="w-full"
              size="lg"
              data-testid="button-start-test"
            >
              <Eye className="mr-2 h-5 w-5" />
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-3xl mb-6">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="font-medium" data-testid="text-phase">
            {currentPhase.label}
          </span>
          <span className="text-muted-foreground" data-testid="text-trial">
            Trial {currentTrial + 1} of {TRIALS_PER_CONE}
          </span>
        </div>
        <Progress value={progress} className="h-2" data-testid="progress-bar" />
        <div className="text-xs text-muted-foreground mt-1 text-right">
          {completedTrials} / {totalTrials} total
        </div>
      </div>

      <Card className="w-full max-w-3xl">
        <CardContent className="p-0">
          <div 
            className="relative w-full aspect-square bg-[#808080] cursor-pointer select-none flex items-center justify-center"
            onClick={handlePanelClick}
            data-testid="stimulus-panel"
          >
            {/* Hint overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="grid grid-cols-3 grid-rows-3 w-full h-full opacity-0 hover:opacity-10 transition-opacity">
                <div className="col-start-2" />
                <div className="row-start-2" />
                <div className="row-start-2" />
                <div className="row-start-2" />
                <div className="col-start-2" />
              </div>
            </div>

            {/* Landolt C Stimulus */}
            {showStimulus && (
              <div 
                className="text-[200px] font-bold leading-none transition-opacity duration-200"
                style={{
                  color: getStimulusColor(currentPhase.coneType, currentContrast),
                  transform: `rotate(${getRotation(currentDirection)}deg)`,
                  fontFamily: 'monospace',
                  letterSpacing: '-0.1em',
                }}
                data-testid="stimulus-landolt-c"
              >
                C
              </div>
            )}

            {/* Feedback */}
            {showFeedback && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <div className="text-4xl">✓</div>
              </div>
            )}

            {/* Instructions overlay */}
            {!showStimulus && !showFeedback && !isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Click where the gap appears</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-3 gap-2 w-full max-w-md">
        <div />
        <Button 
          variant="outline" 
          size="sm" 
          className="pointer-events-none opacity-50"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <div />
        
        <Button 
          variant="outline" 
          size="sm"
          className="pointer-events-none opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Click the C</span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="pointer-events-none opacity-50"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        
        <div />
        <Button 
          variant="outline" 
          size="sm"
          className="pointer-events-none opacity-50"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <div />
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center max-w-md">
        Contrast: {currentContrast.toFixed(2)}% • Click directly on the side where you see the gap
      </p>
    </div>
  );
}
