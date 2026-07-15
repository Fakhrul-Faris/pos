import { useEffect, useState } from 'react'
import type { NavBusinessCategory, NavMenuColumn } from './nav-menu-data'

type NavDropdownPanelProps = {
  active: boolean
  columns: NavMenuColumn[]
  onClose: () => void
}

type NavBusinessesPanelProps = {
  active: boolean
  categories: NavBusinessCategory[]
  onClose: () => void
}

const defaultCategoryId = (categories: NavBusinessCategory[]) =>
  categories.find((category) => category.items.length > 0)?.id ?? categories[0]?.id ?? ''

export function NavBusinessesPanel({
  active,
  categories,
  onClose,
}: NavBusinessesPanelProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(() =>
    defaultCategoryId(categories),
  )

  useEffect(() => {
    if (active) setActiveCategoryId(defaultCategoryId(categories))
  }, [active, categories])

  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ?? categories[0]

  return (
    <div
      className="nav-popup group/popup absolute top-[calc(100%-8px)] left-0 w-full pt-6 transition-all duration-300 ease-out origin-top opacity-0 scale-90 pointer-events-none data-[active=true]:opacity-100 data-[active=true]:scale-100 data-[active=true]:pointer-events-auto"
      data-active={active}
    >
      <div className="nav-popup-panel overflow-hidden">
        <div className="nav-popup-tiered">
          <div className="nav-popup-tier nav-popup-tier--categories">
            <p className="nav-popup-heading">Categories</p>
            <div className="nav-popup-tier__list" role="listbox" aria-label="Business categories">
              {categories.map((category) => {
                const selected = category.id === activeCategory?.id

                return (
                  <button
                    key={category.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`nav-popup-category${selected ? ' is-active' : ''}`}
                    onMouseEnter={() => setActiveCategoryId(category.id)}
                    onFocus={() => setActiveCategoryId(category.id)}
                    onClick={() => setActiveCategoryId(category.id)}
                  >
                    <span className="nav-popup-category__title">{category.title}</span>
                    <span className="nav-popup-category__tagline">{category.tagline}</span>
                    {category.comingSoon ? (
                      <span className="nav-popup-category__badge">Coming soon</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="nav-popup-tier nav-popup-tier--businesses">
            <p className="nav-popup-heading">
              {activeCategory ? activeCategory.title : 'Businesses'}
            </p>
            {activeCategory && activeCategory.items.length > 0 ? (
              <div className="nav-popup-tier__list">
                {activeCategory.items.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    className="nav-popup-item"
                    onClick={onClose}
                  >
                    <span className="nav-popup-item-title">
                      {item.title}
                      {item.live === false ? (
                        <span className="nav-popup-item-badge">Coming soon</span>
                      ) : null}
                    </span>
                    <span className="nav-popup-item-desc">{item.description}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="nav-popup-empty">
                <p className="nav-popup-empty__title">Coming soon</p>
                <p className="nav-popup-empty__desc">
                  We&apos;re building workflows for {activeCategory?.title.toLowerCase()}{' '}
                  shops. Start free and we&apos;ll notify you when yours launches.
                </p>
                <a href="#cta" className="nav-popup-empty__link" onClick={onClose}>
                  Start free
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
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
        <div
          className={`nav-popup-grid nav-popup-grid--${columns.length === 2 ? 2 : 3}`}
        >
          {columns.map((column) => (
            <div key={column.heading} className="nav-popup-tier">
              <p className="nav-popup-heading">{column.heading}</p>
              <div className="nav-popup-tier__list">
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
