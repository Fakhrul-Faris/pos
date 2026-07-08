import { useStore } from '../data/store'

export function BarberSwitcher() {
  const { staff, actingStaffId, setActingStaffId } = useStore()

  return (
    <div className="flex items-center gap-1 rounded-full border border-fog bg-mist p-1">
      {staff.map((s) => {
        const active = s.id === actingStaffId
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setActingStaffId(s.id)}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-paper-white text-carbon shadow-subtle'
                : 'text-ash hover:text-carbon'
            }`}
            aria-pressed={active}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${s.headerClass}`}
            >
              {s.name.charAt(0)}
            </span>
            {s.name}
          </button>
        )
      })}
      <span className="px-2 text-[10px] font-medium uppercase tracking-ui text-ash">Manager</span>
    </div>
  )
}
