import { Button, Empty, Input, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ChangeEvent, ReactNode } from 'react'

export function PageHeading({ title, subtitle, extra }: { title: string; subtitle?: string; extra?: ReactNode }) {
  return <div className="page-heading"><div><h1>{title}<span className="heading-dot">.</span></h1>{subtitle && <p>{subtitle}</p>}</div>{extra}</div>
}

export function SearchField({ value, onChange, onSubmit, placeholder = 'Buscar…' }: { value: string; onChange: (value: string) => void; onSubmit?: () => void; placeholder?: string }) {
  return <Input className="product-search" aria-label={placeholder} prefix={<SearchOutlined />} placeholder={placeholder} allowClear value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} onPressEnter={onSubmit} />
}

export function StatusText({ active }: { active: boolean }) {
  return <span className={`product-status ${active ? 'active' : 'inactive'}`}>{active ? 'Activo' : 'Inactivo'}</span>
}

export function StockText({ stock }: { stock: number }) {
  return stock === 0 ? <span className="out-of-stock">Sin existencias</span> : <span className="stock">{stock} <span>uds.</span></span>
}

export function StateFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Select aria-label="Filtrar por estado" value={value} onChange={onChange} options={[{ value: 'all', label: 'Todos los estados' }, { value: 'active', label: 'Activos' }, { value: 'inactive', label: 'Inactivos' }]} />
}

export function NoResults({ onClear }: { onClear?: () => void }) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No hay registros que mostrar">{onClear && <Button onClick={onClear}>Limpiar filtros</Button>}</Empty>
}

