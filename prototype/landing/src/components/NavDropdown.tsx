import type { NavMenuColumn } from './nav-menu-data'

type NavDropdownPanelProps = {
  active: boolean
  columns: NavMenuColumn[]
  onClose: () => void
}

export function NavDropdownPanel({
  active,
  columns,
  onClose,
}: NavDropdownPanelProps) {
  return (
    <div
      className="nav-popup group/popup absolute top-[calc(100%-8px)] left-0 w-full pt-6 transition-all duration-300 ease-out origin-top opacity-0 scale-90 pointer-events-none data-[active=true]:opacity-100 data-[active=true]:scale-100 data-[active=true]:pointer-events-auto"
      data-active={active}
    >
      <div className="nav-popup-panel overflow-hidden">
        <div className={`p-1 grid gap-1 ${columns.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {columns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-0.5">
              <p className="nav-popup-heading">{column.heading}</p>
              {column.items.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="nav-popup-item"
                  onClick={onClose}
                >
                  <span className="nav-popup-item-title">{item.title}</span>
                  <span className="nav-popup-item-desc">{item.description}</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

type NavDropdownTriggerProps = {
  label: string
  open: boolean
  onEnter: () => void
  onLeave: () => void
}

export function NavDropdownTrigger({
  label,
  open,
  onEnter,
  onLeave,
}: NavDropdownTriggerProps) {
  return (
    <button
      type="button"
      className={`nav-link nav-dropdown-trigger ${open ? 'is-open' : ''}`}
      aria-expanded={open}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
    >
      {label}
      <svg
        className="nav-dropdown-chevron"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
      >
        <path
          d="M3 4.5L6 7.5L9 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
