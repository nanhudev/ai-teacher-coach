import type { ReactNode } from 'react'
import type { ThemeTokens } from '../themes'

export function SlideShell({
  theme,
  children,
  className = '',
}: {
  theme: ThemeTokens
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden ${className}`}
      style={{
        background: theme.bg,
        color: theme.fg,
        boxShadow: theme.shadow,
      }}
    >
      {theme.mesh && (
        <div className="pointer-events-none absolute inset-0" style={{ background: theme.mesh }} />
      )}
      <div className="relative z-[1] flex h-full min-h-0 flex-col">{children}</div>
    </div>
  )
}

export function BulletList({
  items,
  theme,
  size,
}: {
  items: string[]
  theme: ThemeTokens
  size?: string
}) {
  return (
    <ul className="space-y-3" style={{ fontSize: size || theme.bodySize }}>
        {items.slice(0, 5).map((b) => (
        <li key={b} className="flex gap-3 leading-snug">
          <span style={{ color: theme.accent }}>●</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  )
}
