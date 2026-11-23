import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Alert, Button, Descriptions, Form, Input, InputNumber, Modal, Select, Table, Tabs } from 'antd'
import { cashCut, cashDifference, openCashShift } from '../../data/inventory-model'
import type { CashShift } from '../../data/inventory-model'
import type { InventoryController } from '../../data/useInventory'
import { dateTime, inDateRange, money } from '../../shared/format'
import { NoResults, PageHeading } from '../../shared/ui'
import { useFeedback } from '../../shared/useFeedback'

interface CashValues { amount: number }

function BalanceResult({ difference }: { difference: number }) {
  if (difference === 0) return <strong className="positive">Caja cuadrada</strong>
  return <strong className={difference < 0 ? 'negative' : 'out-of-stock'}>
    {difference < 0 ? 'Faltante' : 'Sobrante'} de {money(Math.abs(difference))}
  </strong>
}

function CashAmountForm({ expected, onCancel, onConfirm }: {
  expected?: number
  onCancel: () => void
  onConfirm: (amount: number) => void
}) {
  const [form] = Form.useForm<CashValues>()
  const amount = Form.useWatch('amount', form)
  const closing = expected !== undefined

  return <Form<CashValues> form={form} layout="vertical" onFinish={({ amount }: CashValues) => onConfirm(amount)}>
    {closing && <p>Efectivo esperado: <strong>{money(expected)}</strong></p>}
    <Form.Item name="amount" label={closing ? 'Efectivo contado (MXN)' : 'Monto inicial (MXN)'}
      extra={closing ? undefined : 'Captura 0 si abres el turno sin efectivo.'}
      rules={[{ required: true, type: 'number', min: 0, message: 'Ingresa un monto de cero o más.' }]}>
      <InputNumber className="full-width" prefix="$" step={0.01} />
    </Form.Item>
    {closing && typeof amount === 'number' && amount >= 0 && <p aria-live="polite"><BalanceResult difference={cashDifference(amount, expected)} /></p>}
    <div className="form-footer modal-actions">
      <Button onClick={onCancel}>Cancelar</Button>
      <Button type="primary" htmlType="submit" className={`action-tone ${closing ? 'action-adjust' : 'action-save'}`}>
        {closing ? 'Confirmar cierre' : 'Abrir turno'}
      </Button>
    </div>
  </Form>
}

export function CashPage({ store, onSell }: { store: InventoryController; onSell: () => void }) {
  const [dialog, setDialog] = useState<'open' | 'close' | null>(null)
  const [tab, setTab] = useState('current')
  const [cutFilter, setCutFilter] = useState<string>()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const feedback = useFeedback()
  const { state, isAdmin, run } = store
  const active = openCashShift(state)
  const filter = cutFilter ?? active?.id ?? 'period'
  const byPeriod = filter === 'period'
  const invalidPeriod = byPeriod && !!from && !!to && from > to
  const selectedShift = state.cashShifts.find(shift => shift.id === filter)
  const cut = cashCut(invalidPeriod ? [] : state.sales.filter(sale =>
    byPeriod ? inDateRange(sale.date, from, to) : sale.cashShiftId === filter,
  ))
  const expected = active ? Math.round((active.openingBalance + cashCut(state.sales.filter(sale => sale.cashShiftId === active.id)).total) * 100) / 100 : 0
  const closeDialog = () => setDialog(null)

  function openTurn(openingBalance: number) {
    feedback(() => {
      const next = run({ type: 'openCash', openingBalance })
      setCutFilter(next.cashShifts[0].id)
      closeDialog()
    }, 'Turno de caja abierto.')
  }

  function closeTurn(countedCash: number) {
    if (!active) return
    feedback(() => {
      run({ type: 'closeCash', cashShiftId: active.id, countedCash })
      setCutFilter(active.id)
      closeDialog()
    }, 'Cierre de caja registrado.')
  }

  const operations = <>
    <section className="panel cash-panel" aria-labelledby="cash-shift-title">
      <div className="panel-heading">
        <h2 id="cash-shift-title">Turno de caja</h2>
        <strong className={active ? 'positive' : 'out-of-stock'}>{active ? 'Abierto' : 'Sin turno abierto'}</strong>
      </div>
      {active ? <Descriptions column={{ xs: 1, sm: 2 }} items={[
        { key: 'opened', label: 'Apertura', children: dateTime(active.openedAt) },
        { key: 'user', label: 'Abrió', children: active.openedBy },
        { key: 'balance', label: 'Monto inicial', children: money(active.openingBalance) },
        ...(isAdmin ? [{ key: 'expected', label: 'Efectivo esperado', children: money(expected) }] : []),
      ]} /> : <p className="muted">Captura el efectivo inicial para empezar a vender.</p>}
      <div className="form-footer modal-actions">
        {!active && <Button type="primary" onClick={() => setDialog('open')}>Abrir turno</Button>}
        {active && <Button onClick={onSell}>Ir a Ventas</Button>}
        {active && isAdmin && <Button type="primary" className="action-tone action-adjust" onClick={() => setDialog('close')}>Cerrar turno</Button>}
      </div>
    </section>

    {isAdmin && <section className="panel cash-panel" aria-labelledby="cash-cut-title">
      <div className="panel-heading"><h2 id="cash-cut-title">Corte de caja</h2></div>
      <div className="module-toolbar">
        <Select aria-label="Alcance del corte" value={filter} onChange={setCutFilter} options={[
          { value: 'period', label: 'Por periodo' },
          ...state.cashShifts.map(shift => ({
            value: shift.id,
            label: `Turno ${shift.closing ? 'cerrado' : 'abierto'} · ${dateTime(shift.openedAt)}`,
          })),
        ]} />
        {byPeriod && <>
          <div className="date-field"><label htmlFor="cash-from">Desde</label><Input id="cash-from" type="date" value={from} max={to || undefined} onChange={(event: ChangeEvent<HTMLInputElement>) => setFrom(event.target.value)} /></div>
          <div className="date-field"><label htmlFor="cash-to">Hasta</label><Input id="cash-to" type="date" value={to} min={from || undefined} onChange={(event: ChangeEvent<HTMLInputElement>) => setTo(event.target.value)} /></div>
        </>}
      </div>
      {invalidPeriod ? <Alert type="warning" showIcon title="La fecha inicial debe ser igual o anterior a la final." /> : <>
        <Descriptions column={{ xs: 1, sm: 2 }} items={[
          { key: 'count', label: 'Ventas registradas', children: cut.salesCount },
          { key: 'total', label: 'Total vendido', children: <strong>{money(cut.total)}</strong> },
        ]} />
        {selectedShift?.closing && <Descriptions className="cash-closing-detail" column={{ xs: 1, sm: 2 }} title="Arqueo del turno" items={[
          { key: 'opened', label: 'Apertura', children: dateTime(selectedShift.openedAt) },
          { key: 'openedBy', label: 'Abrió', children: selectedShift.openedBy },
          { key: 'date', label: 'Cierre', children: dateTime(selectedShift.closing.date) },
          { key: 'user', label: 'Cerró', children: selectedShift.closing.userName },
          { key: 'initial', label: 'Monto inicial', children: money(selectedShift.openingBalance) },
          { key: 'expected', label: 'Efectivo esperado', children: money(selectedShift.openingBalance + cut.total) },
          { key: 'counted', label: 'Efectivo contado', children: money(selectedShift.closing.countedCash) },
          { key: 'difference', label: 'Resultado', children: <BalanceResult difference={cashDifference(selectedShift.closing.countedCash, selectedShift.openingBalance + cut.total)} /> },
        ]} />}
        <Table rowKey="productId" dataSource={cut.products} scroll={{ x: 460 }} pagination={{ pageSize: 8, hideOnSinglePage: true }}
          locale={{ emptyText: <NoResults /> }} columns={[
            { title: 'PRODUCTO', dataIndex: 'name' },
            { title: 'UNIDADES VENDIDAS', dataIndex: 'quantity', align: 'right' },
            { title: 'IMPORTE', dataIndex: 'total', align: 'right', render: money },
          ]} />
      </>}
    </section>}
  </>

  const salesByShift = new Map<string, number>()
  if (isAdmin) {
    for (const sale of state.sales) {
      if (sale.cashShiftId) {
        const cents = salesByShift.get(sale.cashShiftId) ?? 0
        salesByShift.set(sale.cashShiftId, cents + Math.round(sale.total * 100))
      }
    }
  }

  return <>
    <PageHeading title="Caja" subtitle="Abre un turno para registrar ventas y concilia el efectivo al cerrar." />
    {isAdmin ? <Tabs activeKey={tab} onChange={setTab} items={[
      { key: 'current', label: 'Turno y corte', children: operations },
      { key: 'history', label: 'Historial de turnos', children: <div className="table-container">
        <Table<CashShift> rowKey="id" dataSource={state.cashShifts} scroll={{ x: 1000 }}
          pagination={{ pageSize: 8, hideOnSinglePage: true, showSizeChanger: false }}
          locale={{ emptyText: 'Todavía no hay turnos registrados.' }} columns={[
            { title: 'APERTURA', dataIndex: 'openedAt', render: dateTime },
            { title: 'ABRIÓ', dataIndex: 'openedBy' },
            { title: 'CIERRE', key: 'closedAt', render: (_: unknown, shift: CashShift) => shift.closing ? dateTime(shift.closing.date) : '—' },
            { title: 'MONTO INICIAL', dataIndex: 'openingBalance', align: 'right', render: money },
            { title: 'TOTAL VENDIDO', key: 'total', align: 'right', render: (_: unknown, shift: CashShift) => money((salesByShift.get(shift.id) ?? 0) / 100) },
            { title: 'ESTADO', key: 'status', render: (_: unknown, shift: CashShift) => <strong className={`product-status ${shift.closing ? 'inactive' : 'active'}`}>{shift.closing ? 'Cerrado' : 'Abierto'}</strong> },
            { title: 'RESULTADO', key: 'result', render: (_: unknown, shift: CashShift) => shift.closing
              ? <BalanceResult difference={cashDifference(shift.closing.countedCash, shift.openingBalance + (salesByShift.get(shift.id) ?? 0) / 100)} />
              : 'Pendiente de cierre' },
            { title: 'ACCIONES', key: 'actions', render: (_: unknown, shift: CashShift) => <Button type="link" aria-label={`Ver corte del turno del ${dateTime(shift.openedAt)}`} onClick={() => {
              setCutFilter(shift.id)
              setTab('current')
            }}>Ver corte</Button> },
          ]} />
      </div> },
    ]} /> : operations}

    <Modal open={dialog === 'open' && !active} centered title="Abrir turno" footer={null} onCancel={closeDialog}
      mask={{ closable: false }} destroyOnHidden>
      <CashAmountForm onCancel={closeDialog} onConfirm={openTurn} />
    </Modal>
    <Modal open={dialog === 'close' && !!active && isAdmin} centered title="Cerrar turno" footer={null} onCancel={closeDialog}
      mask={{ closable: false }} destroyOnHidden>
      <CashAmountForm expected={expected} onCancel={closeDialog} onConfirm={closeTurn} />
    </Modal>
  </>
}
