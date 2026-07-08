type StatCardProps = {
  label: string
  value: string
  hint?: string
  trend?: { direction: 'up' | 'down' | 'flat'; text: string }
}

export function StatCard({ label, value, hint, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-fog bg-paper-white px-3 py-3">
      <p className="text-xs text-ash">{label}</p>
      <p className="font-display tabular-nums mt-1 text-2xl font-medium tracking-ui text-carbon">
        {value}
      </p>
      {(hint || trend) && (
        <p className="mt-1 text-xs text-ash">
          {trend && (
            <span
              className={
                trend.direction === 'up'
                  ? 'font-medium text-mint'
                  : trend.direction === 'down'
                    ? 'font-medium text-ember'
                    : ''
              }
            >
              {trend.text}
            </span>
          )}
          {trend && hint ? ' · ' : null}
          {hint}
        </p>
      )}
    </div>
  )
}
