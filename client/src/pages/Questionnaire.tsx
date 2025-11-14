import { useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';
import { Questionnaire as QuestionnaireType } from '../../../shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye } from 'lucide-react';

export default function Questionnaire() {
  const { updateQuestionnaire, nextStep } = useApp();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<QuestionnaireType>({
    name: '',
    age: 25,
    cvdType: 'unknown',
    screenTimePerWeek: 40,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof QuestionnaireType, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof QuestionnaireType, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.age < 1 || formData.age > 120) {
      newErrors.age = 'Age must be between 1 and 120';
    }

    if (formData.screenTimePerWeek < 0 || formData.screenTimePerWeek > 168) {
      newErrors.screenTimePerWeek = 'Screen time must be between 0 and 168 hours per week';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await updateQuestionnaire(formData);
      nextStep();
      setLocation('/cone-test');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to the CVD Adaptive UI Study</CardTitle>
          <CardDescription>
            Please answer a few questions before we begin the Cone Contrast Sensitivity Test.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                data-testid="input-name"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                min="1"
                max="120"
                data-testid="input-age"
              />
              {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvdType">Do you have color vision deficiency?</Label>
              <Select
                value={formData.cvdType}
                onValueChange={(value) => setFormData({ ...formData, cvdType: value as any })}
              >
                <SelectTrigger id="cvdType" data-testid="select-cvd-type">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">I don't know</SelectItem>
                  <SelectItem value="none">No, I have normal color vision</SelectItem>
                  <SelectItem value="protanopia">Yes, Protanopia (red deficiency)</SelectItem>
                  <SelectItem value="deuteranopia">Yes, Deuteranopia (green deficiency)</SelectItem>
                  <SelectItem value="tritanopia">Yes, Tritanopia (blue-yellow deficiency)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenTime">Average screen time per week (hours)</Label>
              <Input
                id="screenTime"
                type="number"
                value={formData.screenTimePerWeek}
                onChange={e => setFormData({ ...formData, screenTimePerWeek: parseInt(e.target.value) || 0 })}
                min="0"
                max="168"
                data-testid="input-screen-time"
              />
              {errors.screenTimePerWeek && (
                <p className="text-sm text-destructive">{errors.screenTimePerWeek}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              data-testid="button-continue"
            >
              <Eye className="mr-2 h-5 w-5" />
              Begin Cone Contrast Test
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
