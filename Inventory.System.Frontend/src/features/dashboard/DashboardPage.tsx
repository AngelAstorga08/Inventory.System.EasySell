import { Button, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import { AppstoreOutlined, ShoppingCartOutlined, SwapOutlined, WarningOutlined } from '@ant-design/icons'
import type { InventoryController } from '../../data/useInventory'
import type { Movement } from '../../data/inventory-model'
import { dateTime, dayKey, money } from '../../shared/format'
import { NoResults, PageHeading } from '../../shared/ui'
import { Stats } from '../../shared/Stats'

export function DashboardPage({ store, navigate }: { store: InventoryController; navigate: (route: string) => void }) {
  const { state } = store
  const today = dayKey()
  const todaySales = state.sales.filter(sale => dayKey(new Date(sale.date)) === today)
  const low = state.products.filter(product => product.active && product.stock <= 5)
  const pending = state.discrepancies.filter(item => !item.resolved).length
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - 6 + index)
    const key = dayKey(date)
    return { key, label: date.toLocaleDateString('es-MX', { weekday: 'short' }), total: state.sales.filter(sale => dayKey(new Date(sale.date)) === key).reduce((sum, sale) => sum + sale.total, 0) }
  })
  const max = Math.max(1, ...days.map(day => day.total))
  const columns: TableColumnsType<Movement> = [
    { title: 'PRODUCTO', dataIndex: 'productName' }, { title: 'TIPO', dataIndex: 'type' },
    { title: 'CAMBIO', dataIndex: 'quantity', render: (quantity: number) => <span className={quantity >= 0 ? 'positive' : 'negative'}>{quantity > 0 ? '+' : ''}{quantity}</span> },
    { title: 'FECHA', dataIndex: 'date', render: dateTime },
  ]
  return <>
    <PageHeading title="Resumen de tu negocio" subtitle={`Hola, ${store.user?.name.split(' ')[0]}. Así se mueve tu inventario.`} extra={<Button type="primary" onClick={() => navigate('ventas')}>Nueva venta</Button>} />
    <Stats items={[
      { label: 'Ventas de hoy', value: money(todaySales.reduce((sum, sale) => sum + sale.total, 0)), note: `${todaySales.length} ventas registradas`, icon: <ShoppingCartOutlined /> },
      { label: 'Productos activos', value: state.products.filter(product => product.active).length, note: `${state.products.length} productos en catálogo`, icon: <AppstoreOutlined /> },
      { label: 'Existencias bajas', value: low.length, note: 'Productos con 5 unidades o menos', icon: <SwapOutlined />, tone: 'amber' },
      { label: 'Discrepancias', value: pending, note: 'Pendientes de revisar', icon: <WarningOutlined />, tone: 'pink' },
    ]} />
    <div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><h2>Ventas de la semana</h2><p>Últimos 7 días · MXN</p></div><Button type="link" onClick={() => navigate('reportes')}>Ver reportes</Button></div><div className="weekly-chart" aria-label="Ventas de los últimos siete días">{days.map(day => <div className="chart-column" key={day.key}><span>{money(day.total)}</span><div className="chart-track"><div className="chart-bar" style={{ height: `${day.total / max * 100}%` }} title={`${day.key}: ${money(day.total)}`} /></div><span>{day.label}</span></div>)}</div></section>
      <section className="panel"><div className="panel-heading"><h2>Para revisar</h2></div><button className="review-item" onClick={() => navigate('productos')}><span className="stat-icon amber"><AppstoreOutlined /></span><span><strong>{low.length} productos por reponer</strong><small>Existencias de 5 unidades o menos</small></span><span>→</span></button><button className="review-item" onClick={() => navigate('discrepancias')}><span className="stat-icon pink"><WarningOutlined /></span><span><strong>{pending} discrepancias pendientes</strong><small>Revisa los conteos de tu inventario</small></span><span>→</span></button><div className="quick-note"><span className="eyebrow">UN BUEN HÁBITO</span><p>Registra cada entrada y salida para mantener tus existencias al día.</p></div></section>
    </div>
    <section className="panel activity-panel"><div className="panel-heading"><h2>Actividad reciente</h2><Button type="link" onClick={() => navigate('movimientos')}>Ver movimientos</Button></div><Table<Movement> rowKey="id" columns={columns} dataSource={state.movements.slice(0, 5)} pagination={false} scroll={{ x: 650 }} locale={{ emptyText: <NoResults /> }} /></section>
  </>
}
