import { useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';
import { Questionnaire as QuestionnaireType } from '../../../shared/schema';

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
    <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1>Welcome to the CVD Adaptive UI Study</h1>
      <p className="small">
        Please answer a few questions before we begin the Cone Contrast Test.
      </p>
      <div className="space"></div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            className="input"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your name"
            data-testid="input-name"
          />
          {errors.name && <div className="small" style={{ color: 'var(--warning)' }}>{errors.name}</div>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="age">Age</label>
          <input
            id="age"
            type="number"
            className="input"
            value={formData.age}
            onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
            min="1"
            max="120"
            data-testid="input-age"
          />
          {errors.age && <div className="small" style={{ color: 'var(--warning)' }}>{errors.age}</div>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="cvdType">Do you have color vision deficiency?</label>
          <select
            id="cvdType"
            className="select"
            value={formData.cvdType}
            onChange={e => setFormData({ ...formData, cvdType: e.target.value as any })}
            data-testid="select-cvd-type">
            <option value="unknown">I don't know</option>
            <option value="none">No, I have normal color vision</option>
            <option value="protanopia">Yes, Protanopia (red deficiency)</option>
            <option value="deuteranopia">Yes, Deuteranopia (green deficiency)</option>
            <option value="tritanopia">Yes, Tritanopia (blue-yellow deficiency)</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="screenTime">Average screen time per week (hours)</label>
          <input
            id="screenTime"
            type="number"
            className="input"
            value={formData.screenTimePerWeek}
            onChange={e => setFormData({ ...formData, screenTimePerWeek: parseInt(e.target.value) || 0 })}
            min="0"
            max="168"
            data-testid="input-screen-time"
          />
          {errors.screenTimePerWeek && (
            <div className="small" style={{ color: 'var(--warning)' }}>{errors.screenTimePerWeek}</div>
          )}
        </div>

        <div className="space"></div>
        <button type="submit" className="btn" data-testid="button-continue">
          Continue to Cone Test
        </button>
      </form>
    </div>
  );
}
