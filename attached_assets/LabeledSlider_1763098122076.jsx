export default function LabeledSlider({label, value, setValue, min=0, max=100, step=1, suffix='%'}) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'130px 1fr 60px',alignItems:'center',gap:10}}>
      <label>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>setValue(Number(e.target.value))}/>
      <div className="small" style={{textAlign:'right'}}>{value}{suffix}</div>
    </div>
  )
}
