import { useFeedback } from '../../shared/useFeedback'
import { useState } from 'react'
import { App, Descriptions, Modal, Dropdown, Button, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { InventoryController } from '../../data/useInventory'
import { money, normalize } from '../../shared/format'
import { BarcodeScanner } from '../../shared/BarcodeScanner'
import { NoResults, PageHeading, SearchField, StateFilter, StatusText, StockText } from '../../shared/ui'
import { ProductForm } from './ProductForm'
import type { Product, ProductValues } from './product'

export function ProductsPage({ store }: { store: InventoryController }) {
  const { state, run, isAdmin } = store
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [newBarcode, setNewBarcode] = useState('')
  const [detailId, setDetailId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const feedback = useFeedback()
  const { modal } = App.useApp()
  const detail = state.products.find(product => product.id === detailId)
  const filtered = state.products.filter(product =>
    normalize(`${product.name} ${product.description} ${product.id} ${product.barcode ?? ''}`).includes(normalize(query.trim())) &&
    (status === 'all' || product.active === (status === 'active')),
  )

  function saveProduct(values: ProductValues) {
    feedback(() => {
      run({ type: 'saveProduct', id: editing?.id, values })
      setQuery(''); setStatus('all'); setPage(1); setCreating(false); setEditing(null); setNewBarcode('')
    }, editing ? 'Producto actualizado.' : 'Producto agregado.')
  }

  function scan(code: string) {
    const product = state.products.find(item => item.barcode === code)
    if (isAdmin) {
      setEditing(product ?? null)
      setCreating(!product)
      setNewBarcode(product ? '' : code)
    }
    else if (product) setDetailId(product.id)
    else feedback(() => { throw new Error('Código no registrado. Un administrador puede agregar el producto.') })
  }

  function toggleProduct(product: Product) {
    const update = () => feedback(() => {
      run({ type: 'toggleProduct', id: product.id })
      setPage(1)
    }, product.active ? 'Producto desactivado.' : 'Producto activado.')

    if (product.active) {
      modal.confirm({
        title: `¿Desactivar ${product.name}?`,
        content: 'El producto dejará de estar disponible para nuevas ventas.',
        okText: 'Desactivar',
        okButtonProps: { danger: true },
        onOk: update,
      })
    } else update()
  }

  function actions(product: Product) {
    return <Dropdown trigger={['click']} menu={{ items: [
      { key: 'detail', label: 'Ver detalle', onClick: () => setDetailId(product.id) },
      ...(isAdmin ? [
        { key: 'edit', label: 'Editar', onClick: () => { setCreating(false); setEditing(product) } },
        { key: 'status', danger: product.active, label: product.active ? 'Desactivar' : 'Activar', onClick: () => toggleProduct(product) },
      ] : []),
    ] }}><Button type="text" className="row-actions" aria-label={`Opciones de ${product.name}`}>Opciones</Button></Dropdown>
  }

  const columns: TableColumnsType<Product> = [
    { title: 'PRODUCTO', dataIndex: 'name', align: 'center', width: 310, sorter: (a, b) => a.name.localeCompare(b.name, 'es'), render: (_: unknown, product: Product) => <div className="product-cell"><strong>{product.name}</strong><span className="product-description">{product.description || 'Sin descripción'}</span></div> },
    { title: 'CÓDIGO DE BARRAS', dataIndex: 'barcode', width: 180, render: (code: string) => <span className="product-id">{code || 'Sin código'}</span> },
    { title: 'PRECIO', dataIndex: 'price', align: 'right', width: 130, sorter: (a, b) => a.price - b.price, render: (price: number) => <strong className="price">{money(price)}</strong> },
    { title: 'EXISTENCIAS', dataIndex: 'stock', align: 'center', width: 150, render: (stock: number) => <StockText stock={stock} /> },
    { title: 'ESTADO', dataIndex: 'active', width: 110, align: 'center', render: (active: boolean) => <StatusText active={active} /> },
    { title: 'ACCIONES', key: 'actions', align: 'center', width: 120, render: (_: unknown, product: Product) => actions(product) },
  ]

  return <>
    <PageHeading title="Productos" />
    {isAdmin && (creating || editing) && <ProductForm key={editing?.id ?? `new-${newBarcode}`} product={editing ?? undefined} barcode={newBarcode} onSave={saveProduct} onCancel={() => { setCreating(false); setEditing(null); setNewBarcode('') }} />}
    <div className="module-toolbar">
      {isAdmin && <Button type="primary" icon={<PlusOutlined />} disabled={creating} onClick={() => { setNewBarcode(''); setEditing(null); setCreating(true) }}>Agregar producto</Button>}
      <SearchField value={query} onChange={value => { setQuery(value); setPage(1) }} placeholder="Buscar producto o código…" />
      <BarcodeScanner products={state.products} onScan={scan} />
      <div className="toolbar-end"><StateFilter value={status} onChange={value => { setStatus(value); setPage(1) }} /></div>
    </div>
    <div className="table-container desktop-products"><Table<Product> columns={columns} dataSource={filtered} rowKey="id" scroll={{ x: 1000 }} locale={{ emptyText: <NoResults onClear={() => { setQuery(''); setStatus('all') }} /> }} pagination={{ current: page, onChange: setPage, pageSize: 8, showSizeChanger: false, showTotal: (total: number) => `${total} productos` }} /></div>
    <div className="mobile-products">
      <div className="list-count">{filtered.length} productos</div>
      {filtered.length === 0 && <NoResults onClear={() => { setQuery(''); setStatus('all') }} />}
      {filtered.map(product => <article className="mobile-product-card" key={product.id}>
        <div className="mobile-card-heading"><strong>{product.name}</strong><StatusText active={product.active} /></div>
        <p>{product.description || 'Sin descripción'}</p><span className="product-id">{product.barcode || 'Sin código'}</span>
        <div className="mobile-card-bottom"><strong>{money(product.price)}</strong><StockText stock={product.stock} />{actions(product)}</div>
      </article>)}
    </div>
    <Modal centered title="Detalle del producto" open={!!detail} footer={null} onCancel={() => setDetailId(null)}>
      {detail && <Descriptions column={1} items={[
        { key: 'id', label: 'ID', children: `#${String(detail.id).padStart(4, '0')}` },
        { key: 'name', label: 'Nombre', children: detail.name },
        { key: 'barcode', label: 'Código de barras', children: detail.barcode || 'Sin código' },
        { key: 'description', label: 'Descripción', children: detail.description || 'Sin descripción' },
        { key: 'price', label: 'Precio de venta', children: `${money(detail.price)} MXN` },
        { key: 'stock', label: 'Existencias', children: <StockText stock={detail.stock} /> },
        { key: 'status', label: 'Estado', children: <StatusText active={detail.active} /> },
      ]} />}
    </Modal>
  </>
}
