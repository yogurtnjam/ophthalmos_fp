import { useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

export default function CVDResults() {
  const { state, updateRGBAdjustment, nextStep } = useApp();
  const [, setLocation] = useLocation();
  const { coneTestResult, rgbAdjustment } = state;

  const [redHue, setRedHue] = useState(rgbAdjustment.redHue);
  const [greenHue, setGreenHue] = useState(rgbAdjustment.greenHue);
  const [blueHue, setBlueHue] = useState(rgbAdjustment.blueHue);

  if (!coneTestResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Complete Cone Test First</CardTitle>
            <CardDescription>You need to complete the cone contrast test before adjusting colors.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/cone-test')} data-testid="button-go-to-test">
              Go to Cone Test
            </Button>
          </CardContent>
        </Card>
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
        return 'Protanopia (Red/L-cone Deficiency)';
      case 'deutan':
        return 'Deuteranopia (Green/M-cone Deficiency)';
      case 'tritan':
        return 'Tritanopia (Blue/S-cone Deficiency)';
      case 'normal':
        return 'Normal Color Vision';
      default:
        return type;
    }
  };

  const getCVDDescription = (type: string) => {
    switch (type) {
      case 'protan':
        return 'Your test indicates reduced sensitivity to red wavelengths. We will create a custom color filter to enhance red discrimination.';
      case 'deutan':
        return 'Your test indicates reduced sensitivity to green wavelengths. We will create a custom color filter to enhance green discrimination.';
      case 'tritan':
        return 'Your test indicates reduced sensitivity to blue wavelengths. We will create a custom color filter to enhance blue-yellow discrimination.';
      case 'normal':
        return 'Your cone sensitivity appears normal across all wavelengths. You can still customize color adjustments for optimal viewing comfort.';
      default:
        return '';
    }
  };

  // Convert score (0-200) to a normalized 0-1 value for visualization
  const getNormalizedSensitivity = (score: number) => {
    return Math.max(0, Math.min(1, score / 150)); // 150+ is excellent, scale to 0-1
  };

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Test Results Summary */}
        <Card data-testid="card-results-summary">
          <CardHeader>
            <CardTitle data-testid="text-cvd-type">{getCVDTypeLabel(coneTestResult.detectedType)}</CardTitle>
            <CardDescription data-testid="text-cvd-description">
              {getCVDDescription(coneTestResult.detectedType)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cone Sensitivity Overview */}
            <div className="grid gap-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">L-cone (Red) Sensitivity</span>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>Score: {coneTestResult.L.score}</span>
                    <span>Threshold: {coneTestResult.L.threshold}%</span>
                    <span className="font-semibold">{coneTestResult.L.category}</span>
                  </div>
                </div>
                <div className="h-8 bg-muted rounded relative overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 bg-gradient-to-r from-red-200 to-red-600"
                    style={{ width: `${getNormalizedSensitivity(coneTestResult.L.score) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">M-cone (Green) Sensitivity</span>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>Score: {coneTestResult.M.score}</span>
                    <span>Threshold: {coneTestResult.M.threshold}%</span>
                    <span className="font-semibold">{coneTestResult.M.category}</span>
                  </div>
                </div>
                <div className="h-8 bg-muted rounded relative overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 bg-gradient-to-r from-green-200 to-green-600"
                    style={{ width: `${getNormalizedSensitivity(coneTestResult.M.score) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">S-cone (Blue) Sensitivity</span>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>Score: {coneTestResult.S.score}</span>
                    <span>Threshold: {coneTestResult.S.threshold}%</span>
                    <span className="font-semibold">{coneTestResult.S.category}</span>
                  </div>
                </div>
                <div className="h-8 bg-muted rounded relative overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 bg-gradient-to-r from-blue-200 to-blue-600"
                    style={{ width: `${getNormalizedSensitivity(coneTestResult.S.score) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Adjustment Controls */}
        <Card data-testid="card-color-adjustment">
          <CardHeader>
            <CardTitle>Customize Color Adjustments</CardTitle>
            <CardDescription>
              Adjust the hue rotation for each primary color to create your personalized adaptive filter.
              These adjustments will be compared against standard OS preset filters in the next phase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Red Hue Adjustment */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="red-hue" className="text-sm font-medium">
                  Red Hue Rotation
                </label>
                <span className="text-sm text-muted-foreground font-mono" data-testid="text-red-hue">
                  {redHue}°
                </span>
              </div>
              <Slider
                id="red-hue"
                value={[redHue]}
                onValueChange={([value]) => setRedHue(value)}
                min={0}
                max={360}
                step={1}
                className="w-full"
                data-testid="slider-red-hue"
              />
              <div className="h-8 rounded" style={{ 
                background: `linear-gradient(to right, 
                  hsl(0, 80%, 60%), 
                  hsl(60, 80%, 60%), 
                  hsl(120, 80%, 60%), 
                  hsl(180, 80%, 60%), 
                  hsl(240, 80%, 60%), 
                  hsl(300, 80%, 60%), 
                  hsl(360, 80%, 60%)
                )`
              }} />
            </div>

            {/* Green Hue Adjustment */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="green-hue" className="text-sm font-medium">
                  Green Hue Rotation
                </label>
                <span className="text-sm text-muted-foreground font-mono" data-testid="text-green-hue">
                  {greenHue}°
                </span>
              </div>
              <Slider
                id="green-hue"
                value={[greenHue]}
                onValueChange={([value]) => setGreenHue(value)}
                min={0}
                max={360}
                step={1}
                className="w-full"
                data-testid="slider-green-hue"
              />
              <div className="h-8 rounded" style={{ 
                background: `linear-gradient(to right, 
                  hsl(0, 80%, 60%), 
                  hsl(60, 80%, 60%), 
                  hsl(120, 80%, 60%), 
                  hsl(180, 80%, 60%), 
                  hsl(240, 80%, 60%), 
                  hsl(300, 80%, 60%), 
                  hsl(360, 80%, 60%)
                )`
              }} />
            </div>

            {/* Blue Hue Adjustment */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="blue-hue" className="text-sm font-medium">
                  Blue Hue Rotation
                </label>
                <span className="text-sm text-muted-foreground font-mono" data-testid="text-blue-hue">
                  {blueHue}°
                </span>
              </div>
              <Slider
                id="blue-hue"
                value={[blueHue]}
                onValueChange={([value]) => setBlueHue(value)}
                min={0}
                max={360}
                step={1}
                className="w-full"
                data-testid="slider-blue-hue"
              />
              <div className="h-8 rounded" style={{ 
                background: `linear-gradient(to right, 
                  hsl(0, 80%, 60%), 
                  hsl(60, 80%, 60%), 
                  hsl(120, 80%, 60%), 
                  hsl(180, 80%, 60%), 
                  hsl(240, 80%, 60%), 
                  hsl(300, 80%, 60%), 
                  hsl(360, 80%, 60%)
                )`
              }} />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Color Preview</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-16 rounded" style={{ 
                  backgroundColor: `hsl(${redHue}, 70%, 60%)` 
                }}>
                  <div className="text-xs text-center mt-5 font-semibold text-white drop-shadow">Red</div>
                </div>
                <div className="h-16 rounded" style={{ 
                  backgroundColor: `hsl(${greenHue}, 70%, 60%)` 
                }}>
                  <div className="text-xs text-center mt-5 font-semibold text-white drop-shadow">Green</div>
                </div>
                <div className="h-16 rounded" style={{ 
                  backgroundColor: `hsl(${blueHue}, 70%, 60%)` 
                }}>
                  <div className="text-xs text-center mt-5 font-semibold text-white drop-shadow">Blue</div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleContinue} 
                className="w-full"
                size="lg"
                data-testid="button-continue"
              >
                Continue to Task Comparison
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
