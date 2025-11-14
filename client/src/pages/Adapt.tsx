import { useApp } from '../context/AppContext';
import { adaptFromCones, applyManualAdjust } from '../utils/color';
import LabeledSlider from '../components/LabeledSlider';
import ContrastBadge from '../components/ContrastBadge';

function Swatch({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ padding: 18, borderRadius: 12, background: bg, color: fg, fontWeight: 700 }}>{label}</div>
      <div className="space"></div>
      <ContrastBadge fg={fg} bg={bg} />
      <div className="small">
        fg {fg} on bg {bg}
      </div>
    </div>
  );
}

export default function Adapt() {
  const { state, setState } = useApp();
  const { cones, manual, perApp } = state;
  const adapted = adaptFromCones(perApp.baseFg, cones);
  const adjusted = applyManualAdjust(adapted, manual, perApp.bg);
  return (
    <div className="row row-2">
      <div className="card">
        <h2>Per-App Tuning</h2>
        <label>App Name</label>
        <input
          className="input"
          value={perApp.name}
          onChange={e => setState(s => ({ ...s, perApp: { ...s.perApp, name: e.target.value } }))}
          data-testid="input-app-name"
        />
        <div className="space"></div>
        <label>Background</label>
        <input
          className="input"
          type="color"
          value={perApp.bg}
          onChange={e => setState(s => ({ ...s, perApp: { ...s.perApp, bg: e.target.value } }))}
          data-testid="input-background"
        />
        <div className="space"></div>
        <label>Base Text Color</label>
        <input
          className="input"
          type="color"
          value={perApp.baseFg}
          onChange={e => setState(s => ({ ...s, perApp: { ...s.perApp, baseFg: e.target.value } }))}
          data-testid="input-text-color"
        />
      </div>

      <div className="card">
        <h2>Manual Adjust</h2>
        <LabeledSlider
          label="Hue Shift"
          value={manual.hShift}
          setValue={v => setState(s => ({ ...s, manual: { ...s.manual, hShift: v } }))}
          min={-45}
          max={45}
          step={1}
          suffix="°"
        />
        <LabeledSlider
          label="Saturation"
          value={Math.round(manual.sMult * 100)}
          setValue={v => setState(s => ({ ...s, manual: { ...s.manual, sMult: v / 100 } }))}
          min={50}
          max={150}
        />
        <LabeledSlider
          label="Lightness"
          value={Math.round(manual.lMult * 100)}
          setValue={v => setState(s => ({ ...s, manual: { ...s.manual, lMult: v / 100 } }))}
          min={70}
          max={130}
        />
        <LabeledSlider
          label="Extra Contrast"
          value={manual.extraContrast}
          setValue={v => setState(s => ({ ...s, manual: { ...s.manual, extraContrast: v } }))}
          min={0}
          max={10}
        />
      </div>

      <Swatch label="Baseline" fg={state.perApp.baseFg} bg={state.perApp.bg} />
      <Swatch label="Adapted (Cones)" fg={adapted} bg={state.perApp.bg} />
      <Swatch label="Adapted + Manual" fg={adjusted} bg={state.perApp.bg} />
    </div>
  );
}
