import type { ReactNode } from 'react'

export function Stats({ items }: { items: { label: string; value: ReactNode; note?: string; icon?: ReactNode; tone?: string }[] }) {
  return <div className="stats-grid">{items.map(item => <article className="stat-card" key={item.label}><div className="stat-top"><span>{item.label}</span>{item.icon && <span className={`stat-icon ${item.tone ?? ''}`}>{item.icon}</span>}</div><strong className="stat-value">{item.value}</strong>{item.note && <span className="stat-note">{item.note}</span>}</article>)}</div>
}
