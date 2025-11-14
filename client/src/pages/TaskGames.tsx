import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';
import { applyCustomAdaptiveFilter, applyOSPresetFilter } from '../utils/filters';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from '../utils/color';
import { TaskPerformance } from '../../../shared/schema';

type GameState = 'tile-1' | 'tile-2' | 'color-match' | 'card-match' | 'complete';

export default function TaskGames() {
  const { state, addTaskPerformance } = useApp();
  const [, setLocation] = useLocation();
  const { rgbAdjustment, selectedOSPreset, currentFilterMode } = state;

  const [currentGame, setCurrentGame] = useState<GameState>('tile-1');
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [swipes, setSwipes] = useState(0);

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
    if (currentGame === 'tile-1') {
      setCurrentGame('tile-2');
    } else if (currentGame === 'tile-2') {
      setCurrentGame('color-match');
    } else if (currentGame === 'color-match') {
      setCurrentGame('card-match');
    } else if (currentGame === 'card-match') {
      setCurrentGame('complete');
    }
  };

  const incrementClick = () => setClicks(c => c + 1);
  const incrementSwipe = () => setSwipes(s => s + 1);

  if (currentGame === 'complete') {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Tasks Complete!</h2>
        <p>All games finished with {currentFilterMode} filter.</p>
        <div className="space"></div>
        <button className="btn" onClick={() => setLocation('/statistics')} data-testid="button-view-stats">
          View Statistics
        </button>
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

      {currentGame === 'tile-1' && (
        <DifferentTileGame
          round={1}
          isActive={isGameActive}
          onStart={handleGameStart}
          onComplete={handleGameComplete}
          onClick={incrementClick}
          applyFilter={applyFilter}
        />
      )}

      {currentGame === 'tile-2' && (
        <DifferentTileGame
          round={2}
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

// Game 1 & 2: Different Tile Picker
function DifferentTileGame({
  round,
  isActive,
  onStart,
  onComplete,
  onClick,
  applyFilter,
}: {
  round: number;
  isActive: boolean;
  onStart: () => void;
  onComplete: (correct: boolean) => void;
  onClick: () => void;
  applyFilter: (color: string) => string;
}) {
  const baseColor = round === 1 ? '#3a7d44' : '#1e88e5';
  const tiles = 25;
  const [oddIndex] = useState(Math.floor(Math.random() * tiles));

  // Create slightly different color
  const { r, g, b } = hexToRgb(baseColor);
  const { h, s, l } = rgbToHsl(r, g, b);
  const diffColor = hslToRgb((h + 15) % 360, s, l);
  const oddColor = rgbToHex(diffColor.r, diffColor.g, diffColor.b);

  const handleTileClick = (index: number) => {
    if (!isActive) return;
    onClick();
    const correct = index === oddIndex;
    onComplete(correct);
  };

  return (
    <div>
      <h3>Game {round}: Find the Different Tile</h3>
      <p className="small">Click on the tile that has a slightly different color.</p>
      <div className="space"></div>

      {!isActive ? (
        <button className="btn" onClick={onStart} data-testid={`button-start-tile-${round}`}>
          Start Game {round}
        </button>
      ) : (
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
      )}
    </div>
  );
}

// Game 3: Color Scroll Matcher
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
  const [targetIndex] = useState(Math.floor(Math.random() * numColors));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate random colors
  const [colors] = useState(() => {
    const cols = Array.from({ length: numColors }, (_, i) => {
      if (i === targetIndex) return targetColor;
      const h = Math.floor(Math.random() * 360);
      return `hsl(${h}, 70%, 50%)`;
    });
    return cols;
  });

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
      <h3>Game 3: Color Match Scroller</h3>
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
            Start Game 3
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
                onClick={() => handleColorClick(i)}
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

// Game 4: 6-Card Matching
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
  const [cards] = useState(() => {
    // Create pairs and shuffle
    const pairs = [...cardColors, ...cardColors];
    return pairs.sort(() => Math.random() - 0.5);
  });

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);

  const handleCardClick = (index: number) => {
    if (!isActive || flipped.includes(index) || matched.includes(index)) return;
    onClick();

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first] === cards[second]) {
        setMatched([...matched, first, second]);
        setFlipped([]);

        // Check if all matched
        if (matched.length + 2 === cards.length) {
          setTimeout(() => onComplete(true), 500);
        }
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return (
    <div>
      <h3>Game 4: Card Matching</h3>
      <p className="small">Match pairs of colored cards.</p>
      <div className="space"></div>

      {!isActive ? (
        <button className="btn" onClick={onStart} data-testid="button-start-card-match">
          Start Game 4
        </button>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 400, margin: '0 auto' }}>
          {cards.map((color, i) => (
            <div
              key={i}
              onClick={() => handleCardClick(i)}
              style={{
                aspectRatio: '1',
                borderRadius: 12,
                cursor: 'pointer',
                background:
                  flipped.includes(i) || matched.includes(i)
                    ? applyFilter(color)
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '2px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                transition: 'all 0.3s',
              }}
              data-testid={`card-${i}`}>
              {matched.includes(i) && '✓'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
