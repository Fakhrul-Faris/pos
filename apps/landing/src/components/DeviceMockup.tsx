type DeviceType = 'phone' | 'tablet' | 'laptop'

interface DeviceMockupProps {
  type: DeviceType
  className?: string
  label: string
}

function MockScreen({ type }: { type: DeviceType }) {
  if (type === 'phone') {
    return (
      <div className="flex flex-col gap-2 p-3 h-full">
        <div className="text-caption text-muted">Queue #42</div>
        <div className="card-tint p-3 flex-1 flex flex-col justify-center gap-2">
          <div className="h-2 w-3/4 bg-signal/30 rounded-full" />
          <div className="h-2 w-1/2 bg-ink/10 rounded-full" />
          <div className="mt-2 h-8 w-full bg-signal rounded-[10px]" />
        </div>
      </div>
    )
  }

  if (type === 'tablet') {
    return (
      <div className="flex flex-col gap-3 p-4 h-full">
        <div className="flex gap-2">
          {['Ali', 'Ben', 'Cal'].map((name, i) => (
            <div
              key={name}
              className={`px-3 py-1 rounded-full text-caption ${i === 0 ? 'bg-signal text-paper' : 'bg-linen text-ink'}`}
            >
              {name}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 flex-1">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="card-tint p-2 rounded-xl">
              <div className="h-1.5 w-2/3 bg-ink/15 rounded-full mb-2" />
              <div className="h-1 w-1/2 bg-ink/8 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <div className="flex justify-between items-center">
        <div className="h-2 w-24 bg-ink/15 rounded-full" />
        <div className="h-6 w-6 rounded-full bg-signal/20" />
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1">
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-sm aspect-square ${i % 5 === 0 ? 'bg-signal/25' : 'bg-linen'}`}
          />
        ))}
      </div>
    </div>
  )
}

const frames: Record<DeviceType, { width: string; radius: string }> = {
  phone: { width: 'w-[140px]', radius: 'rounded-[28px]' },
  tablet: { width: 'w-[220px]', radius: 'rounded-[20px]' },
  laptop: { width: 'w-[280px]', radius: 'rounded-t-[12px]' },
}

export function DeviceMockup({ type, className = '', label }: DeviceMockupProps) {
  const frame = frames[type]

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${frame.width} bg-ink ${frame.radius} p-2 shadow-glass`}
        style={{ boxShadow: 'var(--shadow-glass)' }}
      >
        <div className="bg-paper rounded-[inherit] overflow-hidden h-[200px]">
          <MockScreen type={type} />
        </div>
      </div>
      {label ? (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-caption text-muted whitespace-nowrap">
          {label}
        </span>
      ) : null}
    </div>
  )
}

export function DeviceTrio() {
  return (
    <div className="relative flex items-end justify-center gap-4 pt-8 pb-12 min-h-[320px]">
      <div
        className="absolute inset-0 card-tint rounded-[var(--radius-card)] backdrop-blur-sm"
        style={{ boxShadow: 'var(--shadow-glass)' }}
      />
      <DeviceMockup type="phone" label="Customer" className="relative z-10 -mb-4" />
      <DeviceMockup type="tablet" label="Counter POS" className="relative z-20" />
      <DeviceMockup type="laptop" label="Owner web" className="relative z-10 -mb-2 hidden sm:block" />
    </div>
  )
}
