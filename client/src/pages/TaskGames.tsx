import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';
import { applyCustomAdaptiveFilter, applyOSPresetFilter } from '../utils/filters';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from '../utils/color';
import { TaskPerformance } from '../../../shared/schema';

type GameState = 'tile-game' | 'color-match' | 'card-match' | 'complete';

export default function TaskGames() {
  const { state, setState, addTaskPerformance } = useApp();
  const [, setLocation] = useLocation();
  const { rgbAdjustment, selectedOSPreset, currentFilterMode } = state;

  const [currentGame, setCurrentGame] = useState<GameState>('tile-game');
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [swipes, setSwipes] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [, forceUpdate] = useState(0);

  // Update timer display every 100ms while game is active
  useEffect(() => {
    if (!isGameActive) return;
    
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isGameActive]);

  // Apply filter to color based on current mode
  const applyFilter = (color: string): string => {
    if (currentFilterMode === 'custom') {
      return applyCustomAdaptiveFilter(color, rgbAdjustment);
    } else {
      return applyOSPresetFilter(color, currentFilterMode);
    }
  };

  const handleGameStart = () => {
    setIsGameActive(true);
    // Reset timer for each game
    setStartTime(Date.now());
    setClicks(0);
    setSwipes(0);
  };

  const handleGameComplete = (correct: boolean) => {
    const timeMs = Date.now() - startTime;
    const performance: TaskPerformance = {
      taskId: currentGame,
      filterType: currentFilterMode,
      timeMs,
      swipes,
      clicks,
      correct,
      timestamp: new Date().toISOString(),
    };
    addTaskPerformance(performance);
    setIsGameActive(false);

    // Move to next game
    if (currentGame === 'tile-game') {
      setCurrentGame('color-match');
    } else if (currentGame === 'color-match') {
      setCurrentGame('card-match');
    } else if (currentGame === 'card-match') {
      setCurrentGame('complete');
    }
  };

  const incrementClick = () => setClicks(c => c + 1);
  const incrementSwipe = () => setSwipes(s => s + 1);

  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhaseComplete = () => {
    if (isProcessing) return; // Prevent double-click
    
    if (currentFilterMode === 'custom' && !state.hasCompletedCustomTasks) {
      // Completed custom filter tasks, switch to OS preset and reset gameplay
      setIsProcessing(true);
      setIsTransitioning(true);
      setState(s => ({ 
        ...s, 
        hasCompletedCustomTasks: true,
        currentFilterMode: s.selectedOSPreset 
      }));
      // Reset game state for OS preset phase
      setTimeout(() => {
        setCurrentGame('tile-game');
        setIsGameActive(false);
        setIsTransitioning(false);
        setIsProcessing(false);
      }, 100);
    } else {
      // Completed both custom and OS preset tasks, go to statistics
      setIsProcessing(true);
      setLocation('/statistics');
    }
  };

  if (currentGame === 'complete' && !isTransitioning) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Phase Complete!</h2>
        <p>All games finished with {currentFilterMode} filter.</p>
        <p className="small">
          {currentFilterMode === 'custom' && !state.hasCompletedCustomTasks
            ? `Next: You'll repeat the same tasks with ${selectedOSPreset} filter for comparison.`
            : 'Proceeding to statistics...'}
        </p>
        <div className="space"></div>
        <button className="btn" onClick={handlePhaseComplete} data-testid="button-continue">
          {currentFilterMode === 'custom' && !state.hasCompletedCustomTasks
            ? 'Start OS Preset Tasks'
            : 'View Statistics'}
        </button>
      </div>
    );
  }
  
  if (isTransitioning) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Switching to {selectedOSPreset} Filter...</h2>
        <p>Preparing tasks...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Task Games</h2>
        <div className="badge" data-testid="badge-filter-mode">
          Filter: {currentFilterMode}
        </div>
      </div>

      {isGameActive && (
        <div className="flex" style={{ marginBottom: 16 }}>
          <div className="badge" data-testid="badge-time">
            Time: {((Date.now() - startTime) / 1000).toFixed(1)}s
          </div>
          <div className="badge" data-testid="badge-clicks">
            Clicks: {clicks}
          </div>
          <div className="badge" data-testid="badge-swipes">
            Swipes: {swipes}
          </div>
        </div>
      )}

      {currentGame === 'tile-game' && (
        <TileGame
          isActive={isGameActive}
          onStart={handleGameStart}
          onComplete={handleGameComplete}
          onClick={incrementClick}
          applyFilter={applyFilter}
        />
      )}

      {currentGame === 'color-match' && (
        <ColorScrollMatcher
          isActive={isGameActive}
          onStart={handleGameStart}
          onComplete={handleGameComplete}
          onClick={incrementClick}
          onSwipe={incrementSwipe}
          applyFilter={applyFilter}
        />
      )}

      {currentGame === 'card-match' && (
        <CardMatchingGame
          isActive={isGameActive}
          onStart={handleGameStart}
          onComplete={handleGameComplete}
          onClick={incrementClick}
          applyFilter={applyFilter}
        />
      )}
    </div>
  );
}

// Game 1: Tile Game (3+ rounds)
function TileGame({
  isActive,
  onStart,
  onComplete,
  onClick,
  applyFilter,
}: {
  isActive: boolean;
  onStart: () => void;
  onComplete: (correct: boolean) => void;
  onClick: () => void;
  applyFilter: (color: string) => string;
}) {
  const MIN_ROUNDS = 3;
  const tiles = 25;
  const [round, setRound] = useState(0);
  const [oddIndex, setOddIndex] = useState(Math.floor(Math.random() * tiles));
  const [baseColor, setBaseColor] = useState('#3a7d44');

  const generateNewRound = () => {
    const colors = ['#3a7d44', '#1e88e5', '#e63946', '#f4a261', '#2a9d8f', '#8e44ad'];
    setBaseColor(colors[Math.floor(Math.random() * colors.length)]);
    setOddIndex(Math.floor(Math.random() * tiles));
  };

  // Reset to round 0 and generate new colors when game becomes active
  useEffect(() => {
    if (isActive) {
      setRound(0);
      generateNewRound();
    }
  }, [isActive]);

  const { r, g, b } = hexToRgb(baseColor);
  const { h, s, l } = rgbToHsl(r, g, b);
  const diffColor = hslToRgb((h + 15) % 360, s, l);
  const oddColor = rgbToHex(diffColor.r, diffColor.g, diffColor.b);

  const handleTileClick = (index: number) => {
    if (!isActive) return;
    onClick();
    const correct = index === oddIndex;
    
    if (round + 1 >= MIN_ROUNDS) {
      // Complete the game after minimum rounds
      onComplete(correct);
    } else {
      // Generate new round
      setRound(r => r + 1);
      generateNewRound();
    }
  };

  return (
    <div>
      <h3>Game 1: Find the Different Tile</h3>
      <p className="small">Click on the tile that has a slightly different color. ({MIN_ROUNDS} rounds)</p>
      <div className="space"></div>

      {!isActive ? (
        <button className="btn" onClick={onStart} data-testid="button-start-tile-game">
          Start Game 1
        </button>
      ) : (
        <>
          <div style={{ marginBottom: 12, textAlign: 'center' }}>
            <span className="small">Round {round + 1} of {MIN_ROUNDS}</span>
          </div>
          <div className="grid5">
            {Array.from({ length: tiles }).map((_, i) => (
              <button
                key={i}
                className="tile"
                style={{
                  background: applyFilter(i === oddIndex ? oddColor : baseColor),
                  cursor: 'pointer',
                  border: 'none',
                }}
                onClick={() => handleTileClick(i)}
                data-testid={`tile-${i}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Game 2: Color Scroll Matcher
function ColorScrollMatcher({
  isActive,
  onStart,
  onComplete,
  onClick,
  onSwipe,
  applyFilter,
}: {
  isActive: boolean;
  onStart: () => void;
  onComplete: (correct: boolean) => void;
  onClick: () => void;
  onSwipe: () => void;
  applyFilter: (color: string) => string;
}) {
  const targetColor = '#e63946';
  const numColors = 20;
  const [targetIndex, setTargetIndex] = useState(Math.floor(Math.random() * numColors));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate random colors - regenerate when game starts
  const [colors, setColors] = useState<string[]>([]);

  // Regenerate colors when game becomes active
  useEffect(() => {
    if (isActive && colors.length === 0) {
      const newTargetIndex = Math.floor(Math.random() * numColors);
      setTargetIndex(newTargetIndex);
      
      const cols = Array.from({ length: numColors }, (_, i) => {
        if (i === newTargetIndex) return targetColor;
        const h = Math.floor(Math.random() * 360);
        return `hsl(${h}, 70%, 50%)`;
      });
      setColors(cols);
    }
  }, [isActive, colors.length, numColors]);

  // Reset colors when game becomes inactive
  useEffect(() => {
    if (!isActive && colors.length > 0) {
      setColors([]);
    }
  }, [isActive, colors.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isActive) return;

    const handleScroll = () => {
      onSwipe();
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isActive, onSwipe]);

  const handleColorClick = (index: number) => {
    if (!isActive) return;
    onClick();
    const correct = index === targetIndex;
    onComplete(correct);
  };

  return (
    <div>
      <h3>Game 2: Color Match Scroller</h3>
      <p className="small">Find and click the color that matches the target below.</p>
      <div className="space"></div>

      {!isActive ? (
        <>
          <div
            style={{
              width: 80,
              height: 80,
              background: applyFilter(targetColor),
              borderRadius: 12,
              margin: '0 auto 16px',
              border: '3px solid #333',
            }}
            data-testid="target-color"
          />
          <button className="btn" onClick={onStart} data-testid="button-start-color-match">
            Start Game 2
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              width: 80,
              height: 80,
              background: applyFilter(targetColor),
              borderRadius: 12,
              margin: '0 auto 16px',
              border: '3px solid #333',
            }}
            data-testid="target-color-active"
          />
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 12,
            }}
            data-testid="color-scroller">
            {colors.map((color, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => handleColorClick(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleColorClick(i);
                  }
                }}
                style={{
                  minWidth: 80,
                  height: 80,
                  background: applyFilter(color),
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: '2px solid #ddd',
                }}
                data-testid={`color-option-${i}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Game 3: Card Matching
function CardMatchingGame({
  isActive,
  onStart,
  onComplete,
  onClick,
  applyFilter,
}: {
  isActive: boolean;
  onStart: () => void;
  onComplete: (correct: boolean) => void;
  onClick: () => void;
  applyFilter: (color: string) => string;
}) {
  const cardColors = ['#e63946', '#f4a261', '#2a9d8f', '#e76f51', '#264653', '#e9c46a'];
  const [cards, setCards] = useState<string[]>([]);

  const [selected, setSelected] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Generate and shuffle cards when game becomes active
  useEffect(() => {
    if (isActive && cards.length === 0) {
      const pairs = [...cardColors, ...cardColors];
      setCards(pairs.sort(() => Math.random() - 0.5));
      setSelected([]);
      setMatched([]);
      setIsChecking(false);
    }
  }, [isActive, cards.length, cardColors]);

  // Reset cards when game becomes inactive
  useEffect(() => {
    if (!isActive && cards.length > 0) {
      setCards([]);
    }
  }, [isActive, cards.length]);

  const handleCardClick = (index: number) => {
    // Don't allow clicks if: not active, card already matched, or currently checking
    if (!isActive || matched.includes(index) || isChecking) return;
    
    // Don't select the same card twice
    if (selected.includes(index)) return;
    
    onClick();

    const newSelected = [...selected, index];
    setSelected(newSelected);

    // Check if we have two cards selected
    if (newSelected.length === 2) {
      setIsChecking(true);
      const [first, second] = newSelected;
      
      if (cards[first] === cards[second]) {
        // Match found - add to matched and clear selected
        setTimeout(() => {
          setMatched(prevMatched => {
            const newMatched = [...prevMatched, first, second];
            // Check if all matched
            if (newMatched.length === cards.length) {
              setTimeout(() => onComplete(true), 500);
            }
            return newMatched;
          });
          setSelected([]);
          setIsChecking(false);
        }, 600);
      } else {
        // No match - reset selected cards
        setTimeout(() => {
          setSelected([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  return (
    <div>
      <h3>Game 3: Card Matching</h3>
      <p className="small">Click two cards to find matching color pairs. Matched cards will disappear.</p>
      <div className="space"></div>

      {!isActive ? (
        <button className="btn" onClick={onStart} data-testid="button-start-card-match">
          Start Game 3
        </button>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 400, margin: '0 auto' }}>
          {cards.map((color, i) => {
            const isMatched = matched.includes(i);
            const isSelected = selected.includes(i);
            
            return (
              <div
                key={i}
                onClick={() => handleCardClick(i)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 12,
                  cursor: isMatched ? 'default' : 'pointer',
                  background: applyFilter(color),
                  border: isSelected ? '4px solid #000' : '2px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  transition: 'all 0.3s',
                  opacity: isMatched ? 0 : 1,
                  visibility: isMatched ? 'hidden' : 'visible',
                  transform: isSelected ? 'scale(0.95)' : 'scale(1)',
                }}
                data-testid={`card-${i}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
