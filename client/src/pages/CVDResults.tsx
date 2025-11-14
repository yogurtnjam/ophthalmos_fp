import { useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';

export default function CVDResults() {
  const { state, updateRGBAdjustment, nextStep } = useApp();
  const [, setLocation] = useLocation();
  const { coneTestResult, rgbAdjustment } = state;

  const [redHue, setRedHue] = useState(rgbAdjustment.redHue);
  const [greenHue, setGreenHue] = useState(rgbAdjustment.greenHue);
  const [blueHue, setBlueHue] = useState(rgbAdjustment.blueHue);

  if (!coneTestResult) {
    return (
      <div className="card">
        <p>Please complete the Cone Contrast Test first.</p>
        <button className="btn" onClick={() => setLocation('/cone-test')} data-testid="button-go-to-test">
          Go to Test
        </button>
      </div>
    );
  }

  const handleContinue = () => {
    updateRGBAdjustment({ redHue, greenHue, blueHue });
    nextStep();
    setLocation('/tasks');
  };

  const getCVDTypeLabel = (type: string) => {
    switch (type) {
      case 'protan':
        return 'Protanopia (Red Deficiency)';
      case 'deutan':
        return 'Deuteranopia (Green Deficiency)';
      case 'tritan':
        return 'Tritanopia (Blue-Yellow Deficiency)';
      case 'normal':
        return 'Normal Color Vision';
      default:
        return type;
    }
  };

  return (
    <div className="row row-2">
      <div className="card">
        <h2>Your Cone Sensitivity Results</h2>
        <div className="space"></div>

        <div className="badge" style={{ fontSize: 14, padding: '8px 16px' }} data-testid="badge-cvd-type">
          Detected Type: {getCVDTypeLabel(coneTestResult.detectedType)}
        </div>
        <div className="space"></div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div className="card" style={{ padding: 12 }}>
            <strong>L-cone (Red) Sensitivity</strong>
            <div
              style={{
                width: '100%',
                height: 24,
                background: `linear-gradient(to right, #fff 0%, #f00 100%)`,
                borderRadius: 6,
                marginTop: 8,
                position: 'relative',
              }}>
              <div
                style={{
                  position: 'absolute',
                  left: `${coneTestResult.L * 100}%`,
                  top: -4,
                  width: 4,
                  height: 32,
                  background: '#000',
                  borderRadius: 2,
                }}
              />
            </div>
            <div className="small" data-testid="text-l-score">{(coneTestResult.L * 100).toFixed(0)}%</div>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <strong>M-cone (Green) Sensitivity</strong>
            <div
              style={{
                width: '100%',
                height: 24,
                background: `linear-gradient(to right, #fff 0%, #0f0 100%)`,
                borderRadius: 6,
                marginTop: 8,
                position: 'relative',
              }}>
              <div
                style={{
                  position: 'absolute',
                  left: `${coneTestResult.M * 100}%`,
                  top: -4,
                  width: 4,
                  height: 32,
                  background: '#000',
                  borderRadius: 2,
                }}
              />
            </div>
            <div className="small" data-testid="text-m-score">{(coneTestResult.M * 100).toFixed(0)}%</div>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <strong>S-cone (Blue) Sensitivity</strong>
            <div
              style={{
                width: '100%',
                height: 24,
                background: `linear-gradient(to right, #fff 0%, #00f 100%)`,
                borderRadius: 6,
                marginTop: 8,
                position: 'relative',
              }}>
              <div
                style={{
                  position: 'absolute',
                  left: `${coneTestResult.S * 100}%`,
                  top: -4,
                  width: 4,
                  height: 32,
                  background: '#000',
                  borderRadius: 2,
                }}
              />
            </div>
            <div className="small" data-testid="text-s-score">{(coneTestResult.S * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Adjust RGB Hue Values</h2>
        <p className="small">Fine-tune the color adjustments to better fit your perception.</p>
        <div className="space"></div>

        {/* Red Hue Wheel */}
        <div style={{ marginBottom: 20 }}>
          <label>Red Hue Adjustment: {redHue}°</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `hsl(${redHue}, 100%, 50%)`,
                border: '3px solid #333',
              }}
              data-testid="color-wheel-red"
            />
            <input
              type="range"
              className="input"
              style={{ flex: 1 }}
              min="0"
              max="360"
              value={redHue}
              onChange={e => setRedHue(parseInt(e.target.value))}
              data-testid="slider-red-hue"
            />
          </div>
        </div>

        {/* Green Hue Wheel */}
        <div style={{ marginBottom: 20 }}>
          <label>Green Hue Adjustment: {greenHue}°</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `hsl(${greenHue}, 100%, 50%)`,
                border: '3px solid #333',
              }}
              data-testid="color-wheel-green"
            />
            <input
              type="range"
              className="input"
              style={{ flex: 1 }}
              min="0"
              max="360"
              value={greenHue}
              onChange={e => setGreenHue(parseInt(e.target.value))}
              data-testid="slider-green-hue"
            />
          </div>
        </div>

        {/* Blue Hue Wheel */}
        <div style={{ marginBottom: 20 }}>
          <label>Blue Hue Adjustment: {blueHue}°</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `hsl(${blueHue}, 100%, 50%)`,
                border: '3px solid #333',
              }}
              data-testid="color-wheel-blue"
            />
            <input
              type="range"
              className="input"
              style={{ flex: 1 }}
              min="0"
              max="360"
              value={blueHue}
              onChange={e => setBlueHue(parseInt(e.target.value))}
              data-testid="slider-blue-hue"
            />
          </div>
        </div>

        <div className="space"></div>
        <button className="btn" onClick={handleContinue} data-testid="button-continue">
          Continue to Tasks
        </button>
      </div>
    </div>
  );
}
