'use client'

/**
 * Local Sidebar kit mirroring shadcn/ui Sidebar composition.
 * @see https://ui.shadcn.com/docs/components/base/sidebar
 *
 * No full shadcn install — same Provider / Header / Content / Footer /
 * Group / Menu / Trigger / Inset / Rail API, themed to Geist dark tokens.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_ICON = '3.5rem'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'
const SIDEBAR_COOKIE = 'miki_admin_sidebar'

type SidebarContextValue = {
  state: 'expanded' | 'collapsed'
  open: boolean
  setOpen: (open: boolean | ((v: boolean) => boolean)) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const apply = () => setMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [breakpoint])
  return mobile
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  style,
  children,
  ...props
}: ComponentProps<'div'> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = useState(false)
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const open = openProp ?? internalOpen

  const setOpen = useCallback(
    (value: boolean | ((v: boolean) => boolean)) => {
      const next = typeof value === 'function' ? value(open) : value
      if (onOpenChange) onOpenChange(next)
      else setInternalOpen(next)
      try {
        document.cookie = `${SIDEBAR_COOKIE}=${next ? '1' : '0'}; path=/; max-age=31536000`
      } catch {
        /* ignore */
      }
    },
    [onOpenChange, open],
  )

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile((v) => !v)
    else setOpen((v) => !v)
  }, [isMobile, setOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleSidebar])

  const state = open ? 'expanded' : 'collapsed'

  const value = useMemo<SidebarContextValue>(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, isMobile, toggleSidebar],
  )

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
            ...style,
          } as CSSProperties
        }
        className={cn(
          'group/sidebar-wrapper flex min-h-dvh w-full bg-background',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}: ComponentProps<'div'> & {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}) {
  const { isMobile, state, open, setOpen, openMobile, setOpenMobile } = useSidebar()
  const [hoverExpanded, setHoverExpanded] = useState(false)

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          'flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        {openMobile && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setOpenMobile(false)}
          />
        )}
        <div
          data-slot="sidebar"
          data-mobile="true"
          data-side={side}
          className={cn(
            'fixed inset-y-0 z-50 flex h-dvh w-[min(18rem,85vw)] flex-col bg-sidebar text-sidebar-foreground shadow-panel transition-transform duration-200 ease-out md:hidden',
            side === 'left' ? 'left-0' : 'right-0',
            openMobile
              ? 'translate-x-0'
              : side === 'left'
                ? '-translate-x-full'
                : 'translate-x-full',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </>
    )
  }

  const effectiveState = hoverExpanded ? 'expanded' : state
  const effectiveCollapsible = effectiveState === 'collapsed' ? collapsible : 'none'

  return (
    <div
      data-slot="sidebar-container"
      data-state={effectiveState}
      data-collapsible={effectiveCollapsible}
      data-variant={variant}
      data-side={side}
      onMouseEnter={() => {
        if (!open && collapsible === 'icon') setHoverExpanded(true)
      }}
      onMouseLeave={() => setHoverExpanded(false)}
      className={cn(
        'group peer relative hidden text-sidebar-foreground md:block',
        'w-[var(--sidebar-width)] transition-[width] duration-200 ease-linear',
        'data-[collapsible=icon]:w-[var(--sidebar-width-icon)]',
        'data-[collapsible=offcanvas]:w-0',
        (variant === 'floating' || variant === 'inset') &&
          'data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem)]',
      )}
    >
      <div
        data-slot="sidebar-gap"
        className={cn(
          'relative h-svh bg-transparent transition-[width] duration-200 ease-linear',
          state === 'collapsed' && collapsible === 'icon'
            ? (variant === 'floating' || variant === 'inset')
              ? 'w-[calc(var(--sidebar-width-icon)+1rem)]'
              : 'w-[var(--sidebar-width-icon)]'
            : state === 'collapsed' && collapsible === 'offcanvas'
              ? 'w-0'
              : 'w-[var(--sidebar-width)]',
        )}
      />
      <div
        data-slot="sidebar"
        data-side={side}
        className={cn(
          'fixed inset-y-0 z-10 hidden h-svh transition-[left,right,width] duration-200 ease-linear md:flex',
          effectiveState === 'expanded' ? 'w-[var(--sidebar-width)]' : '',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:-left-[var(--sidebar-width)]'
            : 'right-0 group-data-[collapsible=offcanvas]:-right-[var(--sidebar-width)]',
          variant === 'floating' || variant === 'inset'
            ? cn('p-2', effectiveState === 'collapsed' && 'w-[calc(var(--sidebar-width-icon)+1rem)]')
            : effectiveState === 'collapsed' ? 'w-[var(--sidebar-width-icon)]' : 'w-[var(--sidebar-width)]',
          hoverExpanded && 'shadow-2xl',
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          className={cn(
            'flex h-full w-full flex-col bg-sidebar',
            variant === 'floating' || variant === 'inset'
              ? 'rounded-xl border border-sidebar-border shadow-sm'
              : 'border-r border-sidebar-border',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function SidebarTrigger({
  className,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      aria-label="Toggle sidebar"
      onClick={(e) => {
        onClick?.(e)
        toggleSidebar()
      }}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-sidebar-border text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        className,
      )}
      {...props}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
      </svg>
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
}

export function SidebarRail({ className, ...props }: ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      type="button"
      data-slot="sidebar-rail"
      aria-label="Toggle sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex',
        'group-data-[collapsible=offcanvas]:translate-x-0',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarInset({
  className,
  ...props
}: ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        'relative flex min-h-dvh min-w-0 flex-1 flex-col bg-background',
        'peer-data-[variant=inset]:min-h-[calc(100svh-1rem)] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:border-sidebar-border',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarHeader({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  )
}

export function SidebarFooter({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  )
}

export function SidebarContent({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto overflow-x-hidden',
        'group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarGroup({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      {...props}
    />
  )
}

export function SidebarGroupLabel({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        'flex h-8 shrink-0 items-center rounded-[6px] px-2 text-[10px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/70 outline-none',
        'transition-[margin,opacity,transform] duration-200 ease-linear',
        'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarGroupContent({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn('w-full text-sm', className)}
      {...props}
    />
  )
}

export function SidebarMenu({
  className,
  ...props
}: ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn('flex w-full min-w-0 flex-col gap-0.5', className)}
      {...props}
    />
  )
}

export function SidebarMenuItem({
  className,
  ...props
}: ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  )
}

export function SidebarMenuButton({
  className,
  isActive = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean
}) {
  return (
    <button
      type="button"
      data-slot="sidebar-menu-button"
      data-active={isActive || undefined}
      className={cn(
        'peer/menu-button relative flex w-full items-center gap-2 overflow-hidden rounded-[6px] p-2 text-left text-[13px] outline-none transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:ring-1 focus-visible:ring-sidebar-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground',
        'group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2',
        '[&>span:not([data-sidebar-dot])]:truncate [&>svg]:size-[18px] [&>svg]:shrink-0',
        'group-data-[collapsible=icon]:[&>span:not([data-sidebar-dot])]:hidden',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function SidebarMenuBadge({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      className={cn(
        'pointer-events-none absolute top-1/2 right-1 z-10 flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-[6px] bg-amber-100 px-1 font-mono text-[10px] font-semibold text-amber-900 tabular-nums select-none',
        'peer-hover/menu-button:text-amber-900',
        'peer-data-[active=true]/menu-button:text-amber-900',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarSeparator({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-separator"
      className={cn('mx-2 h-px bg-sidebar-border', className)}
      {...props}
    />
  )
}

/** Tiny helper for collapsed-only badge dot */
export function SidebarMenuDot({
  show,
  className,
}: {
  show?: boolean
  className?: string
}) {
  if (!show) return null
  return (
    <span
      data-sidebar-dot
      className={cn(
        'absolute -top-0.5 -right-0.5 hidden size-2 rounded-full bg-amber-500 ring-2 ring-sidebar group-data-[collapsible=icon]:block',
        className,
      )}
    />
  )
}
