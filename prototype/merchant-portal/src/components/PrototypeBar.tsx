import type { VerticalId } from '../data/mock'
import { verticals } from '../data/mock'

type PrototypeBarProps = {
  verticalId: VerticalId
  onVerticalChange: (id: VerticalId) => void
  demoNowMinutes: number
  onDemoNowMinutesChange: (minutes: number) => void
}

function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

export function PrototypeBar({
  verticalId,
  onVerticalChange,
  demoNowMinutes,
  onDemoNowMinutesChange,
}: PrototypeBarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-fog bg-carbon px-4 py-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-full bg-lavender/20 px-2 py-0.5 font-medium text-lavender">
          PROTOTYPE
        </span>
        <span className="text-paper-white/70">
          Merchant Portal · Acet layout · Visitors theme
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-paper-white/50">Demo time</span>
          <span className="rounded-full bg-paper-white/10 px-2 py-1 text-xs font-medium text-paper-white/90">
            {minutesToLabel(demoNowMinutes)}
          </span>
          <input
            type="range"
            min={9 * 60}
            max={20 * 60}
            step={15}
            value={demoNowMinutes}
            onChange={(e) => onDemoNowMinutesChange(Number(e.target.value))}
            className="w-40"
            aria-label="Demo time"
          />
        </div>

        <span className="text-xs text-paper-white/50">Vertical labels</span>
        <div className="flex rounded-full bg-paper-white/10 p-0.5">
          {(Object.keys(verticals) as VerticalId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onVerticalChange(id)}
              className={[
                'rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                verticalId === id
                  ? 'bg-paper-white text-carbon'
                  : 'text-paper-white/80 hover:text-paper-white',
              ].join(' ')}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
