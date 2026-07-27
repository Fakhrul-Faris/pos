'use client'

import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

/** Dense Geist table shell — gray-100 panel, gray-400 rules, 13px type */
export function Table({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={[
        'overflow-hidden rounded-[12px] border border-gray-400 bg-gray-100',
        className,
      ].join(' ')}
    >
      <div className="overflow-x-auto">
        <table className="geist-table">{children}</table>
      </div>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TR({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <tr
      onClick={onClick}
      className={[onClick ? 'cursor-pointer' : '', className].filter(Boolean).join(' ')}
    >
      {children}
    </tr>
  )
}

export function TH({
  children,
  className = '',
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={className} {...rest}>
      {children}
    </th>
  )
}

export function TD({
  children,
  className = '',
  muted,
  mono,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & {
  muted?: boolean
  mono?: boolean
}) {
  return (
    <td
      className={[
        muted ? 'text-gray-900' : '',
        mono ? 'font-mono tabular-nums' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </td>
  )
}

export function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="!border-0 px-3 py-10 text-center text-gray-900">
        {text}
      </td>
    </tr>
  )
}
