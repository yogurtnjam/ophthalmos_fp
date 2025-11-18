import { contrastRatio } from '../utils/color.js'

export default function ContrastBadge({ fg, bg }){
  const cr = contrastRatio(fg, bg)
  const tag = cr >= 7 ? 'AAA' : cr >= 4.5 ? 'AA' : 'Fail'
  return <div className="badge">Contrast {cr.toFixed(2)}:1 · {tag}</div>
}
