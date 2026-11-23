import type { ChangeEvent } from 'react'
import { useFeedback } from '../../shared/useFeedback'
import { useState } from 'react'
import { Button, Col, Descriptions, Drawer, Form, Input, InputNumber, Modal, Row, Select, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { InventoryController } from '../../data/useInventory'
import type { Movement } from '../../data/inventory-model'
import { BarcodeScanner } from '../../shared/BarcodeScanner'
import { dateTime, inDateRange, normalize } from '../../shared/format'
import { NoResults, PageHeading, SearchField } from '../../shared/ui'

interface MovementValues { productId: number; kind: 'Entrada' | 'Salida'; quantity: number; reason: string }

const movementTones = { Entrada: 'positive', Salida: 'negative', Ajuste: 'adjustment', Venta: '' }

export function MovementsPage({ store }: { store: InventoryController }) {
  const [entryForm, setEntryForm] = useState<'manual' | number | null>(null)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [detail, setDetail] = useState<Movement | null>(null)
  const feedback = useFeedback()
  const activeProducts = store.state.products.filter(product => product.active)
  const scannedProductId = typeof entryForm === 'number' ? entryForm : undefined
  const isScannedEntry = scannedProductId !== undefined

  function scanEntry(code: string) {
    feedback(() => {
      const product = store.state.products.find(item => item.barcode === code)
      if (!product) throw new Error('El código de barras no está registrado en Productos.')
      if (!product.active) throw new Error('Activa el producto antes de registrar una entrada.')
      setEntryForm(product.id)
    })
  }

  const rows = store.state.movements.filter(item => normalize(`${item.productName} ${item.reason} ${item.userName}`).includes(normalize(query)) && (kind === 'all' || item.type === kind) && inDateRange(item.date, from, to))
  const columns: TableColumnsType<Movement> = [
    { title: 'FECHA', dataIndex: 'date', width: 190, render: dateTime },
    { title: 'PRODUCTO', dataIndex: 'productName', width: 260 },
    { title: 'TIPO', dataIndex: 'type', width: 120, render: (type: Movement['type']) => <span className={`movement-type ${movementTones[type]}`}>{type}</span> },
    { title: 'CANTIDAD', dataIndex: 'quantity', align: 'center', width: 110, render: (quantity: number) => <strong className={quantity > 0 ? 'positive' : quantity < 0 ? 'negative' : ''}>{quantity > 0 ? '+' : ''}{quantity}</strong> },
    { title: 'ANTES → DESPUÉS', key: 'balance', align: 'center', width: 170, render: (_: unknown, movement: Movement) => `${movement.previous} → ${movement.next}` },
    { title: 'REGISTRÓ', dataIndex: 'userName', width: 170 },
    { title: 'ACCIONES', key: 'actions', width: 130, render: (_: unknown, movement: Movement) => <Button type="link" onClick={() => setDetail(movement)}>Ver detalle</Button> },
  ]
  return <>
    <PageHeading title="Movimientos" subtitle="Entradas, salidas, ajustes e historial de existencias." />
    <Modal open={store.isAdmin && entryForm !== null} centered width={640}
      title={isScannedEntry ? 'Registrar entrada por código de barras' : 'Registrar entrada o ajuste'}
      onCancel={() => setEntryForm(null)} footer={null} mask={{ closable: false }} destroyOnHidden>
      <Form<MovementValues> key={entryForm ?? 'closed'} layout="vertical" initialValues={{ productId: scannedProductId, kind: 'Entrada', quantity: 1 }} onFinish={(values: MovementValues) => feedback(() => {
        store.run({ type: 'movement', ...values })
        setEntryForm(null)
      }, 'Movimiento registrado. Existencias actualizadas.')}>
        <Row gutter={20}><Col xs={24} md={12}><Form.Item name="productId" label="Producto" rules={[{ required: true, message: 'Selecciona un producto.' }]}><Select disabled={isScannedEntry} showSearch optionFilterProp="label" placeholder="Selecciona un producto activo" options={activeProducts.map(product => ({ value: product.id, label: `${product.name} (${product.stock} uds.)` }))} /></Form.Item></Col>
          <Col xs={24} sm={12} md={6}><Form.Item name="kind" label="Tipo de movimiento" rules={[{ required: true }]}><Select disabled={isScannedEntry} options={[{ value: 'Entrada', label: 'Entrada de existencias' }, { value: 'Salida', label: 'Salida por ajuste' }]} /></Form.Item></Col>
          <Col xs={24} sm={12} md={6}><Form.Item name="quantity" label="Cantidad" rules={[{ required: true, type: 'integer', min: 1, message: 'Ingresa un entero mayor a cero.' }]}><InputNumber autoFocus={isScannedEntry} min={1} className="full-width" /></Form.Item></Col></Row>
        <Form.Item name="reason" label="Motivo" rules={[{ required: true, whitespace: true, message: 'El motivo es obligatorio.' }]}><Input.TextArea rows={2} placeholder="Ej. Recepción de mercancía, merma o corrección de conteo" /></Form.Item>
        <p className="muted small-copy">El movimiento conservará el usuario, la fecha y el saldo anterior.</p>
        <div className="form-footer modal-actions"><Button onClick={() => setEntryForm(null)}>Cancelar</Button><Button type="primary" className="action-tone action-adjust" htmlType="submit">{isScannedEntry ? 'Registrar entrada' : 'Guardar'}</Button></div>
      </Form>
    </Modal>
    <div className="module-toolbar">
      {store.isAdmin && <>
        <Button type="primary" className="action-tone action-adjust" icon={<PlusOutlined />} disabled={entryForm !== null} onClick={() => setEntryForm('manual')}>Entrada o ajuste</Button>
        <BarcodeScanner label="Entrada por código de barras" products={activeProducts} onScan={scanEntry} disabled={entryForm !== null} />
      </>}
      <SearchField value={query} onChange={setQuery} placeholder="Buscar producto, motivo o usuario…" /><Select aria-label="Tipo de movimiento" value={kind} onChange={(value: string) => setKind(value)} options={['all', 'Entrada', 'Salida', 'Venta', 'Ajuste'].map(value => ({ value, label: value === 'all' ? 'Todos los tipos' : value }))} /><div className="date-field"><label htmlFor="movement-from">Desde</label><Input id="movement-from" type="date" value={from} max={to || undefined} onChange={(event: ChangeEvent<HTMLInputElement>) => setFrom(event.target.value)} /></div><div className="date-field"><label htmlFor="movement-to">Hasta</label><Input id="movement-to" type="date" value={to} min={from} onChange={(event: ChangeEvent<HTMLInputElement>) => setTo(event.target.value)} /></div>
    </div>
    <div className="table-container"><Table<Movement> columns={columns} dataSource={rows} rowKey="id" scroll={{ x: 1150 }} locale={{ emptyText: <NoResults /> }} pagination={{ pageSize: 8, showSizeChanger: false }} /></div>
    <Drawer title="Detalle de movimiento" open={!!detail} onClose={() => setDetail(null)}>{detail && <Descriptions column={1} items={[
      { key: 'product', label: 'Producto', children: detail.productName }, { key: 'type', label: 'Tipo', children: detail.type }, { key: 'date', label: 'Fecha', children: dateTime(detail.date) }, { key: 'user', label: 'Registró', children: detail.userName }, { key: 'quantity', label: 'Cantidad', children: detail.quantity }, { key: 'previous', label: 'Existencias anteriores', children: detail.previous }, { key: 'next', label: 'Existencias posteriores', children: detail.next }, { key: 'reason', label: 'Motivo', children: detail.reason },
    ]} />}</Drawer>
  </>
}
