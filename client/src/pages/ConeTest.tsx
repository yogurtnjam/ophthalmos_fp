import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';
import { ConeTestResult } from '../../../shared/schema';

type Direction = 'left' | 'up' | 'right' | 'down';
type ConeType = 'L' | 'M' | 'S';

interface Trial {
  coneType: ConeType;
  direction: Direction;
  contrast: number;
  correct: boolean | null;
}

// Colors for cone-isolating stimuli
const CONE_COLORS = {
  L: { bg: '#808080', fg: (contrast: number) => `rgb(${128 + contrast}, 128, 128)` }, // Red-ish
  M: { bg: '#808080', fg: (contrast: number) => `rgb(128, ${128 + contrast}, 128)` }, // Green-ish
  S: { bg: '#808080', fg: (contrast: number) => `rgb(128, 128, ${128 + contrast})` }, // Blue-ish
};

const DIRECTIONS: Direction[] = ['left', 'up', 'right', 'down'];
const TRIALS_PER_CONE = 8;
const INITIAL_CONTRAST = 100;
const MIN_CONTRAST = 10;

export default function ConeTest() {
  const { updateConeTestResult, nextStep } = useApp();
  const [, setLocation] = useLocation();
  
  const [currentConeType, setCurrentConeType] = useState<ConeType>('L');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentDirection, setCurrentDirection] = useState<Direction>('right');
  const [currentContrast, setCurrentContrast] = useState(INITIAL_CONTRAST);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Generate random direction
  const getRandomDirection = useCallback((): Direction => {
    return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  }, []);

  // Start test
  const handleStart = () => {
    setIsStarted(true);
    setCurrentDirection(getRandomDirection());
  };

  // Handle user response
  const handleDirectionClick = (selectedDirection: Direction) => {
    const isCorrect = selectedDirection === currentDirection;
    
    // Record trial
    const trial: Trial = {
      coneType: currentConeType,
      direction: currentDirection,
      contrast: currentContrast,
      correct: isCorrect,
    };
    setTrials(prev => [...prev, trial]);

    // Show feedback
    setFeedbackMessage(isCorrect ? 'Correct!' : 'Incorrect');
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      
      // Adjust contrast based on response
      if (isCorrect && currentContrast > MIN_CONTRAST) {
        setCurrentContrast(prev => Math.max(MIN_CONTRAST, prev - 15));
      } else if (!isCorrect) {
        setCurrentContrast(prev => Math.min(INITIAL_CONTRAST, prev + 10));
      }

      // Move to next trial or cone type
      if (currentTrial + 1 < TRIALS_PER_CONE) {
        setCurrentTrial(prev => prev + 1);
        setCurrentDirection(getRandomDirection());
      } else {
        // Move to next cone type
        if (currentConeType === 'L') {
          setCurrentConeType('M');
          setCurrentTrial(0);
          setCurrentContrast(INITIAL_CONTRAST);
          setCurrentDirection(getRandomDirection());
        } else if (currentConeType === 'M') {
          setCurrentConeType('S');
          setCurrentTrial(0);
          setCurrentContrast(INITIAL_CONTRAST);
          setCurrentDirection(getRandomDirection());
        } else {
          // Test complete - calculate results
          calculateResults();
        }
      }
    }, 800);
  };

  // Calculate cone sensitivity results
  const calculateResults = () => {
    const lTrials = trials.filter(t => t.coneType === 'L');
    const mTrials = trials.filter(t => t.coneType === 'M');
    const sTrials = trials.filter(t => t.coneType === 'S');

    // Calculate sensitivity score (0-1) based on accuracy and contrast thresholds
    const calculateScore = (coneTrials: Trial[]) => {
      const correctTrials = coneTrials.filter(t => t.correct);
      const avgContrast = correctTrials.reduce((sum, t) => sum + t.contrast, 0) / correctTrials.length;
      const accuracy = correctTrials.length / coneTrials.length;
      
      // Lower contrast threshold with high accuracy = higher sensitivity
      const contrastScore = 1 - (avgContrast / INITIAL_CONTRAST);
      return Math.max(0.2, Math.min(1.0, (contrastScore + accuracy) / 2));
    };

    const L = calculateScore(lTrials);
    const M = calculateScore(mTrials);
    const S = calculateScore(sTrials);

    // Determine CVD type based on cone scores
    let detectedType: 'protan' | 'deutan' | 'tritan' | 'normal';
    if (L < 0.6 && L < M && L < S) {
      detectedType = 'protan';
    } else if (M < 0.6 && M < L && M < S) {
      detectedType = 'deutan';
    } else if (S < 0.6 && S < L && S < M) {
      detectedType = 'tritan';
    } else {
      detectedType = 'normal';
    }

    const result: ConeTestResult = { L, M, S, detectedType };
    updateConeTestResult(result);
    nextStep();
    setLocation('/cvd-results');
  };

  return (
    <div className="card" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
      <h1>Cone Contrast Test</h1>
      <p className="small">
        Identify the direction of the opening in the C-shaped figure. Click the arrow buttons below.
      </p>
      <div className="space"></div>

      {!isStarted ? (
        <div>
          <p>This test will measure your L-cone (red), M-cone (green), and S-cone (blue) sensitivity.</p>
          <p className="small">The test takes approximately 2-3 minutes. Focus on the center of the screen.</p>
          <div className="space"></div>
          <button className="btn" onClick={handleStart} data-testid="button-start-test">
            Start Test
          </button>
        </div>
      ) : (
        <div>
          <div className="badge" data-testid="badge-cone-type">
            Testing: {currentConeType}-cone ({currentConeType === 'L' ? 'Red' : currentConeType === 'M' ? 'Green' : 'Blue'})
          </div>
          <div className="badge" data-testid="badge-trial-count">
            Trial {currentTrial + 1} of {TRIALS_PER_CONE}
          </div>
          <div className="space"></div>

          {/* C-shaped optotype display */}
          <div
            style={{
              width: 200,
              height: 200,
              margin: '40px auto',
              background: CONE_COLORS[currentConeType].bg,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            data-testid="optotype-container">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <LandoltC direction={currentDirection} color={CONE_COLORS[currentConeType].fg(currentContrast)} />
            </svg>
          </div>

          {showFeedback && (
            <div className="badge" style={{ fontSize: 16, padding: '8px 16px' }} data-testid="feedback">
              {feedbackMessage}
            </div>
          )}

          <div className="space"></div>
          <p className="small">Which direction is the opening?</p>
          <div className="space"></div>

          {/* Direction buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 250, margin: '0 auto' }}>
            <div></div>
            <button
              className="btn"
              onClick={() => handleDirectionClick('up')}
              disabled={showFeedback}
              data-testid="button-up"
              style={{ fontSize: 20 }}>
              ↑
            </button>
            <div></div>

            <button
              className="btn"
              onClick={() => handleDirectionClick('left')}
              disabled={showFeedback}
              data-testid="button-left"
              style={{ fontSize: 20 }}>
              ←
            </button>
            <div></div>
            <button
              className="btn"
              onClick={() => handleDirectionClick('right')}
              disabled={showFeedback}
              data-testid="button-right"
              style={{ fontSize: 20 }}>
              →
            </button>

            <div></div>
            <button
              className="btn"
              onClick={() => handleDirectionClick('down')}
              disabled={showFeedback}
              data-testid="button-down"
              style={{ fontSize: 20 }}>
              ↓
            </button>
            <div></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Landolt C component
function LandoltC({ direction, color }: { direction: Direction; color: string }) {
  const rotation = { left: 0, up: 90, right: 180, down: 270 }[direction];
  
  return (
    <g transform={`rotate(${rotation} 60 60)`}>
      <circle cx="60" cy="60" r="40" fill="none" stroke={color} strokeWidth="20" />
      <rect x="60" y="20" width="50" height="20" fill={CONE_COLORS.L.bg} />
    </g>
  );
}
