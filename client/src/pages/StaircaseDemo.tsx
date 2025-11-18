import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calculator } from 'lucide-react';
import { thresholdFromReversals, ThresholdResult, ThresholdError } from '@/lib/staircaseThreshold';

export default function StaircaseDemo() {
  const [contrastInput, setContrastInput] = useState('32, 16, 8, 16, 8, 4, 8, 4, 2, 4, 2, 1, 2, 1');
  const [lastN, setLastN] = useState(6);
  const [discardFirst, setDiscardFirst] = useState(1);
  const [result, setResult] = useState<ThresholdResult | ThresholdError | null>(null);

  const handleCalculate = () => {
    try {
      const contrasts = contrastInput
        .split(',')
        .map(s => parseFloat(s.trim()))
        .filter(n => !isNaN(n));

      if (contrasts.length < 3) {
        setResult({ error: "Please enter at least 3 contrast values" });
        return;
      }

      const calculatedResult = thresholdFromReversals(contrasts, lastN, discardFirst);
      setResult(calculatedResult);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Calculation error" });
    }
  };

  const loadExample = () => {
    setContrastInput('32, 16, 8, 16, 8, 4, 8, 4, 2, 4, 2, 1, 2, 1');
    setLastN(6);
    setDiscardFirst(1);
    setResult(null);
  };

  const isError = (r: ThresholdResult | ThresholdError | null): r is ThresholdError => {
    return r !== null && 'error' in r;
  };

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card data-testid="card-staircase-demo">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle data-testid="text-title">Staircase Threshold Calculator</CardTitle>
                <CardDescription data-testid="text-description">
                  Analyze adaptive staircase test data to compute detection thresholds
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contrasts">Contrast Sequence</Label>
                <Textarea
                  id="contrasts"
                  value={contrastInput}
                  onChange={(e) => setContrastInput(e.target.value)}
                  placeholder="Enter comma-separated contrast values (e.g., 32, 16, 8, 16, 8, 4...)"
                  className="font-mono text-sm"
                  rows={3}
                  data-testid="input-contrasts"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the sequence of contrast values from your adaptive staircase test
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastN">Last N Reversals</Label>
                  <Input
                    id="lastN"
                    type="number"
                    value={lastN}
                    onChange={(e) => setLastN(parseInt(e.target.value) || 6)}
                    min={1}
                    max={20}
                    data-testid="input-last-n"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of reversals to average (typically 6-12)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discardFirst">Discard First</Label>
                  <Input
                    id="discardFirst"
                    type="number"
                    value={discardFirst}
                    onChange={(e) => setDiscardFirst(parseInt(e.target.value) || 1)}
                    min={0}
                    max={5}
                    data-testid="input-discard-first"
                  />
                  <p className="text-xs text-muted-foreground">
                    Early unstable reversals to discard (common: 1 or 2)
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCalculate}
                  className="flex-1"
                  data-testid="button-calculate"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Threshold
                </Button>
                <Button
                  onClick={loadExample}
                  variant="outline"
                  data-testid="button-load-example"
                >
                  Load Example
                </Button>
              </div>
            </div>

            {result && (
              <div className="space-y-4">
                {isError(result) ? (
                  <Card className="bg-destructive/10 border-destructive" data-testid="card-error">
                    <CardContent className="pt-6">
                      <p className="text-destructive font-semibold">Error</p>
                      <p className="text-sm text-destructive/80">{result.error}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card data-testid="card-results">
                      <CardHeader>
                        <CardTitle className="text-lg">Threshold Results</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Estimated Threshold</p>
                            <p className="text-2xl font-bold" data-testid="text-threshold">
                              {result.thresholdMean.toFixed(2)}%
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Standard Deviation</p>
                            <p className="text-2xl font-bold" data-testid="text-std">
                              ±{result.thresholdStd.toFixed(2)}%
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total Reversals Detected</p>
                          <p className="text-lg font-semibold" data-testid="text-total-reversals">
                            {result.totalReversalsFound}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Reversals Used for Threshold ({result.usedForThreshold.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {result.usedForThreshold.map((val, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-primary/10 rounded text-sm font-mono"
                                data-testid={`text-reversal-${idx}`}
                              >
                                {val}%
                              </span>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card data-testid="card-reversal-points">
                      <CardHeader>
                        <CardTitle className="text-lg">Reversal Points</CardTitle>
                        <CardDescription>
                          Points where the contrast direction changed
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {result.reversalPoints.map((rev, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                              data-testid={`card-reversal-point-${idx}`}
                            >
                              <span className="text-xs text-muted-foreground w-16">
                                Index {rev.index}
                              </span>
                              <span className="font-mono font-semibold">
                                {rev.contrast}%
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {rev.directionChange[0] > 0 ? '↑' : '↓'} → {rev.directionChange[1] > 0 ? '↑' : '↓'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-info">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              The staircase threshold calculator analyzes adaptive test data to determine detection thresholds:
            </p>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Detects reversal points where the contrast direction changes</li>
              <li>Discards early unstable reversals (warm-up trials)</li>
              <li>Takes the last N reversals for averaging</li>
              <li>Computes the threshold as the mean of those reversal contrasts</li>
            </ol>
            <p>
              This method is commonly used in psychophysical testing (e.g., Cone Contrast Tests) 
              to estimate perceptual thresholds efficiently.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
