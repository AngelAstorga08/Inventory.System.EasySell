import type { ChangeEvent } from 'react'
import { useFeedback } from '../../shared/useFeedback'
import { useState } from 'react'
import { Alert, Button, Descriptions, Drawer, Input, InputNumber, Popconfirm, Select, Table, Tabs, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import { DeleteOutlined, PlusOutlined, SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import type { InventoryController } from '../../data/useInventory'
import { openCashShift, type Sale } from '../../data/inventory-model'
import { BarcodeScanner } from '../../shared/BarcodeScanner'
import { dateTime, dayKey, inDateRange, money, normalize } from '../../shared/format'
import { NoResults, PageHeading, SearchField } from '../../shared/ui'

interface CartLine { productId: number; quantity: number }

export function SalesPage({ store, onOpenCash }: { store: InventoryController; onOpenCash: () => void }) {
  const [tab, setTab] = useState('new')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [historyQuery, setHistoryQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [seller, setSeller] = useState<number | undefined>()
  const [detailId, setDetailId] = useState<string | null>(null)
  const feedback = useFeedback()
  const shift = openCashShift(store.state)
  const detail = store.state.sales.find(sale => sale.id === detailId)
  const search = normalize(query.trim())
  const products = search ? store.state.products.filter(product => product.active && (
    normalize(product.name).includes(search) || product.barcode?.includes(search)
  )) : []
  const lines = cart.flatMap(line => {
    const product = store.state.products.find(item => item.id === line.productId)
    return product ? [{ ...line, product }] : []
  })
  const total = lines.reduce((sum, line) => sum + Math.round(line.product.price * 100) * line.quantity, 0) / 100

  function add(productId: number) {
    feedback(() => {
      const product = store.state.products.find(item => item.id === productId)
      if (!product?.active) throw new Error('El producto no está disponible para venta.')
      const current = cart.find(line => line.productId === productId)?.quantity ?? 0
      if (current >= product.stock) throw new Error('No hay más existencias disponibles de este producto.')
      setCart(currentLines => current ? currentLines.map(line => line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line) : [...currentLines, { productId, quantity: 1 }])
    })
  }

  function scan(code: string) {
    const product = store.state.products.find(item => item.barcode === code)
    if (product) add(product.id)
    else feedback(() => { throw new Error('Código no registrado en el catálogo.') })
  }

  const history = store.state.sales.filter(sale => normalize(`${sale.folio} ${sale.userName}`).includes(normalize(historyQuery)) && inDateRange(sale.date, from, to) && (!seller || sale.userId === seller))
  const columns: TableColumnsType<Sale> = [
    { title: 'FOLIO', dataIndex: 'folio', render: (folio: string) => <strong>{folio}</strong> },
    { title: 'FECHA', dataIndex: 'date', render: (date: string) => dateTime(date) },
    { title: 'REGISTRÓ', dataIndex: 'userName' },
    { title: 'ARTÍCULOS', key: 'quantity', align: 'center', render: (_: unknown, sale: Sale) => sale.items.reduce((sum, item) => sum + item.quantity, 0) },
    { title: 'TOTAL', dataIndex: 'total', align: 'right', render: money },
    { title: 'ACCIONES', key: 'actions', render: (_: unknown, sale: Sale) => <Button type="link" onClick={() => setDetailId(sale.id)}>Ver detalle</Button> },
  ]

  return <>
    <PageHeading title="Ventas" subtitle="Registra una venta y consulta tu historial." />
    <Tabs activeKey={tab} onChange={setTab} items={[
      { key: 'new', label: 'Nueva venta', children: !shift
        ? <Alert type="warning" showIcon title="Abre un turno de caja para vender" action={<Button onClick={onOpenCash}>Ir a Caja</Button>} />
        : <div className="sales-layout">
        <section className="panel sales-catalog" aria-labelledby="sale-search-title">
          <div className="panel-heading"><h2 id="sale-search-title">Buscar productos</h2></div>
          <div className="module-toolbar">
            <SearchField value={query} onChange={setQuery} onSubmit={() => {
              if (/^\d{8,14}$/.test(query.trim())) scan(query.trim())
            }} placeholder="Buscar por nombre o código de barras…" />
            <BarcodeScanner onScan={scan} />
          </div>
          {!search && <p className="sale-search-hint"><SearchOutlined aria-hidden="true" /> Escribe un nombre o escanea un código para agregar productos a la venta.</p>}
          {search && products.length === 0 && <p className="sale-search-hint" role="status">No se encontraron productos activos para esta búsqueda.</p>}
          {products.length > 0 && <ul className="sale-results" aria-label="Resultados de búsqueda">{products.map(product => <li className="sale-product" key={product.id}>
            <div><h3>{product.name}</h3><span className="product-id">{product.barcode || 'Sin código'}</span>{' · '}{product.stock > 0
              ? <span className="product-status active">{product.stock} disponibles</span>
              : <span className="out-of-stock">Sin existencias</span>}</div>
            <div className="sale-product-action"><strong>{money(product.price)}</strong><Button className="action-tone action-save action-outline" icon={<PlusOutlined />} disabled={product.stock <= (cart.find(line => line.productId === product.id)?.quantity ?? 0)} aria-label={`Agregar ${product.name} a la venta`} onClick={() => add(product.id)}>Agregar</Button></div>
          </li>)}</ul>}
        </section>
        <aside className="cart-panel"><div className="panel-heading"><h2><ShoppingCartOutlined /> Venta actual</h2><span>{lines.reduce((sum, line) => sum + line.quantity, 0)} artículos</span></div>
          {!lines.length && <p className="muted">Todavía no hay productos en la venta.</p>}
          {lines.map(line => <div className="cart-line" key={line.productId}><div className="cart-line-title"><strong>{line.product.name}</strong><Tooltip title="Quitar producto"><Button danger type="text" icon={<DeleteOutlined />} aria-label={`Quitar ${line.product.name}`} onClick={() => setCart(current => current.filter(item => item.productId !== line.productId))} /></Tooltip></div>
            <div className="cart-line-bottom"><InputNumber aria-label={`Cantidad de ${line.product.name}`} min={1} max={line.product.stock} precision={0} value={line.quantity} onChange={(quantity: number | null) => setCart(current => current.map(item => item.productId === line.productId ? { ...item, quantity: quantity ?? 1 } : item))} /><span>{money(line.product.price)} c/u</span><strong>{money(line.product.price * line.quantity)}</strong></div>
          </div>)}
          <div className="cart-total"><span>Total MXN</span><strong>{money(total)}</strong></div><p className="muted small-copy">Las ventas registradas se conservan en el historial y no se cancelan.</p>
          <Button block type="primary" className="action-tone action-save" disabled={!lines.length} onClick={() => feedback(() => {
            const next = store.run({ type: 'sale', cashShiftId: shift.id, items: cart }); setCart([]); setDetailId(next.sales[0].id)
          }, 'Venta registrada. Existencias actualizadas.')}>Registrar venta</Button>
          {!!lines.length && <Popconfirm title="¿Vaciar la venta actual?" okText="Vaciar venta" cancelText="Conservar" okButtonProps={{ danger: true }} onConfirm={() => setCart([])}>
            <Button block danger type="text">Vaciar venta</Button>
          </Popconfirm>}
        </aside>
      </div> },
      { key: 'history', label: `Historial de ventas (${store.state.sales.length})`, children: <>
        <div className="module-toolbar"><SearchField value={historyQuery} onChange={setHistoryQuery} placeholder="Buscar folio o vendedor…" /><Select allowClear placeholder="Todos los vendedores" aria-label="Filtrar vendedor" value={seller} onChange={(value: number | undefined) => setSeller(value)} options={store.state.users.map(user => ({ value: user.id, label: user.name }))} /><div className="date-field"><label htmlFor="sale-from">Desde</label><Input id="sale-from" type="date" value={from} max={to || dayKey()} onChange={(event: ChangeEvent<HTMLInputElement>) => setFrom(event.target.value)} /></div><div className="date-field"><label htmlFor="sale-to">Hasta</label><Input id="sale-to" type="date" value={to} min={from} onChange={(event: ChangeEvent<HTMLInputElement>) => setTo(event.target.value)} /></div></div>
        {from && to && from > to && <Alert type="warning" title="La fecha inicial debe ser anterior a la fecha final." />}
        <div className="table-container"><Table<Sale> rowKey="id" dataSource={history} columns={columns} scroll={{ x: 850 }} locale={{ emptyText: <NoResults /> }} pagination={{ pageSize: 8, showSizeChanger: false }} /></div>
      </> },
    ]} />
    <Drawer title="Detalle de venta" open={!!detail} onClose={() => setDetailId(null)}>
      {detail && <><div className="receipt-heading"><span className="eyebrow">VENTA REGISTRADA</span><h2>{detail.folio}</h2><p>{dateTime(detail.date)}</p></div><Descriptions column={1} items={[{ key: 'user', label: 'Registró', children: detail.userName }]} />
        {detail.items.map(item => <div className="receipt-line" key={item.productId}><strong>{item.name}</strong><div><span>{item.quantity} × {money(item.price)}</span><strong>{money(item.quantity * item.price)}</strong></div></div>)}
        <div className="cart-total"><span>Total MXN</span><strong>{money(detail.total)}</strong></div><Alert type="success" title="Existencias descontadas" description="El movimiento de cada producto está disponible en Movimientos." showIcon /></>}
    </Drawer>
  </>
}
