import type { ChangeEvent } from 'react'
import { useState } from 'react'
import { Alert, Button, Input, Select, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { InventoryController } from '../../data/useInventory'
import { dayKey, inDateRange, money } from '../../shared/format'
import { NoResults, PageHeading } from '../../shared/ui'
import { Stats } from '../../shared/Stats'

interface ProductReport { id: number; name: string; quantity: number; revenue: number }
const weekStart = () => { const date = new Date(); date.setDate(date.getDate() - 6); return dayKey(date) }

function downloadCsv(rows: (string | number)[][]) {
  const csv = '\ufeff' + rows.map(row => row.map(value => {
    const text = String(value)
    const safe = typeof value === 'string' && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
    return `"${safe.replace(/"/g, '""')}"`
  }).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a'); link.href = url; link.download = `reporte-ventas-${dayKey()}.csv`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ReportsPage({ store }: { store: InventoryController }) {
  const [from, setFrom] = useState(weekStart)
  const [to, setTo] = useState(dayKey())
  const [period, setPeriod] = useState('week')
  const invalid = !!(from && to && from > to)
  const sales = store.state.sales.filter(sale => inDateRange(sale.date, from, to))
  const totals = new Map<number, ProductReport>()
  sales.forEach(sale => sale.items.forEach(item => {
    const current = totals.get(item.productId) ?? { id: item.productId, name: item.name, quantity: 0, revenue: 0 }
    totals.set(item.productId, { ...current, quantity: current.quantity + item.quantity, revenue: current.revenue + item.quantity * item.price })
  }))
  const rows = [...totals.values()].sort((a, b) => b.revenue - a.revenue)
  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const units = rows.reduce((sum, row) => sum + row.quantity, 0)
  const max = Math.max(1, ...rows.map(row => row.quantity))
  const inventoryValue = store.state.products.reduce((sum, product) => sum + product.stock * product.price, 0)
  const columns: TableColumnsType<ProductReport> = [
    { title: 'PRODUCTO', dataIndex: 'name' }, { title: 'UNIDADES VENDIDAS', dataIndex: 'quantity', align: 'center', sorter: (a, b) => a.quantity - b.quantity },
    { title: 'IMPORTE VENDIDO', dataIndex: 'revenue', align: 'right', render: money, sorter: (a, b) => a.revenue - b.revenue },
    { title: 'PARTICIPACIÓN', key: 'share', align: 'right', render: (_: unknown, row: ProductReport) => `${revenue ? (row.revenue / revenue * 100).toFixed(1) : '0'} %` },
  ]
  function changePeriod(value: string) {
    setPeriod(value)
    if (value === 'all') { setFrom(''); setTo(''); return }
    const date = new Date(); date.setDate(date.getDate() - (value === 'month' ? 29 : value === 'week' ? 6 : 0))
    setFrom(dayKey(date)); setTo(dayKey())
  }
  return <>
    <PageHeading title="Reportes" subtitle="Consulta el comportamiento de tus ventas e inventario." extra={<Button type="primary" className="action-tone action-export" icon={<DownloadOutlined />} disabled={invalid || !sales.length} onClick={() => downloadCsv([
      ['Folio', 'Fecha', 'Usuario', 'Producto', 'Cantidad', 'Precio unitario MXN', 'Importe MXN'],
      ...sales.flatMap(sale => sale.items.map(item => [sale.folio, new Date(sale.date).toLocaleString('es-MX'), sale.userName, item.name, item.quantity, item.price, Math.round(item.quantity * item.price * 100) / 100])),
    ])}>Exportar CSV</Button>} />
    <div className="module-toolbar"><Select aria-label="Periodo del reporte" value={period} onChange={changePeriod} options={[{ value: 'today', label: 'Hoy' }, { value: 'week', label: 'Últimos 7 días' }, { value: 'month', label: 'Últimos 30 días' }, { value: 'all', label: 'Todo el historial' }, { value: 'custom', label: 'Personalizado' }]} /><div className="date-field"><label htmlFor="report-from">Desde</label><Input id="report-from" type="date" value={from} max={to || undefined} onChange={(event: ChangeEvent<HTMLInputElement>) => { setFrom(event.target.value); setPeriod('custom') }} /></div><div className="date-field"><label htmlFor="report-to">Hasta</label><Input id="report-to" type="date" value={to} min={from} onChange={(event: ChangeEvent<HTMLInputElement>) => { setTo(event.target.value); setPeriod('custom') }} /></div></div>
    {invalid && <Alert type="warning" className="storage-alert" title="Elige un rango de fechas válido." />}
    <Stats items={[{ label: 'Importe vendido', value: money(revenue), note: 'Ventas en el periodo seleccionado' }, { label: 'Ventas registradas', value: sales.length, note: `${units} unidades vendidas` }, { label: 'Venta promedio', value: money(sales.length ? revenue / sales.length : 0), note: 'Promedio por venta del periodo' }, { label: 'Valor del inventario', value: money(inventoryValue), note: 'Existencias actuales a precio de venta' }]} />
    <section className="panel report-chart"><div className="panel-heading"><h2>Productos más vendidos</h2><span>Unidades · periodo seleccionado</span></div>{!rows.length && <NoResults />}{[...rows].sort((a, b) => b.quantity - a.quantity).slice(0, 5).map(row => <div className="ranking-row" key={row.id}><span>{row.name}</span><div className="ranking-track"><div style={{ width: `${row.quantity / max * 100}%` }} /></div><strong>{row.quantity}</strong></div>)}</section>
    <div className="table-container"><Table<ProductReport> rowKey="id" dataSource={rows} columns={columns} scroll={{ x: 700 }} pagination={{ pageSize: 8, showSizeChanger: false }} locale={{ emptyText: <NoResults /> }} /></div>
  </>
}
