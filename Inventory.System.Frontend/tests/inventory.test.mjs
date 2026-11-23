import assert from 'node:assert/strict'
import test from 'node:test'
import { cashCut, cashDifference, createDemoState, executeCommand, openCashShift } from '../src/data/inventory-model.ts'

const withOpenCash = () => executeCommand(createDemoState(), { type: 'openCash', openingBalance: 0 }, 1)

test('demo ledger reconciles with every product balance and recorded sale', () => {
  const state = createDemoState()
  const balances = new Map()
  for (const movement of [...state.movements].reverse()) {
    assert.equal(movement.previous, balances.get(movement.productId) ?? 0)
    assert.equal(movement.next, movement.previous + movement.quantity)
    balances.set(movement.productId, movement.next)
  }
  for (const product of state.products) assert.equal(product.stock, balances.get(product.id) ?? 0)
  for (const sale of state.sales) {
    assert.equal(sale.total, sale.items.reduce((sum, item) => sum + item.price * item.quantity, 0))
    assert.equal(state.movements.filter(movement => movement.saleId === sale.id).length, sale.items.length)
  }
})

test('sale atomically combines repeated products and records the actor and stock change', () => {
  const state = withOpenCash()
  const previous = state.products.find(product => product.id === 1).stock
  const next = executeCommand(state, { type: 'sale', cashShiftId: openCashShift(state).id, items: [{ productId: 1, quantity: 2 }, { productId: 1, quantity: 3 }] }, 2)
  assert.equal(next.products.find(product => product.id === 1).stock, previous - 5)
  assert.equal(state.products.find(product => product.id === 1).stock, previous)
  assert.equal(next.sales[0].items.length, 1)
  assert.equal(next.sales[0].total, 110)
  assert.equal(next.movements[0].userId, 2)
  assert.equal(next.movements[0].saleId, next.sales[0].id)
  assert.equal(next.movements[0].quantity, -5)
})

test('invalid sale cannot partially decrement another product', () => {
  const state = withOpenCash()
  const cashShiftId = openCashShift(state).id
  const snapshot = JSON.stringify(state)
  assert.throws(() => executeCommand(state, { type: 'sale', cashShiftId, items: [{ productId: 1, quantity: 1 }, { productId: 5, quantity: 1 }] }, 1), /insuficientes/)
  assert.equal(JSON.stringify(state), snapshot)
  assert.throws(() => executeCommand(state, { type: 'sale', cashShiftId, items: [{ productId: 8, quantity: 1 }] }, 1), /desactivado/)
  assert.throws(() => executeCommand(state, { type: 'sale', cashShiftId, items: [{ productId: 1, quantity: 0.5 }] }, 1), /entero/)
})

test('inactive users and sellers cannot perform administration', () => {
  const state = createDemoState()
  assert.throws(() => executeCommand(state, { type: 'sale', items: [{ productId: 1, quantity: 1 }] }, 3), /desactivado/)
  assert.throws(() => executeCommand(state, { type: 'toggleProduct', id: 1 }, 2), /Administrador/)
  assert.throws(() => executeCommand(state, { type: 'movement', productId: 1, kind: 'Entrada', quantity: 2, reason: 'Receiving' }, 2), /Administrador/)
  assert.throws(() => executeCommand(state, { type: 'toggleUser', id: 1 }, 1), /propia cuenta/)
})

test('product editing preserves stock, barcode uniqueness and historical sale prices', () => {
  const state = createDemoState()
  const product = state.products.find(product => product.id === 1)
  const next = executeCommand(state, { type: 'saveProduct', id: 1, values: { ...product, stock: 900, price: 30, name: 'Updated product' } }, 1)
  assert.equal(next.products.find(product => product.id === 1).stock, product.stock)
  assert.equal(next.sales.find(sale => sale.items.some(item => item.productId === 1)).items.find(item => item.productId === 1).price, 22)
  assert.throws(() => executeCommand(state, { type: 'saveProduct', values: { ...product, name: 'Duplicate code' } }, 1), /ya pertenece/)
  assert.throws(() => executeCommand(state, { type: 'saveProduct', values: { ...product, barcode: 'abc' } }, 1), /dígitos/)
})

test('stock entries and adjustments require reasons and prevent negative balances', () => {
  const state = createDemoState()
  assert.throws(() => executeCommand(state, { type: 'movement', productId: 1, kind: 'Salida', quantity: 900, reason: 'Count' }, 1), /suficientes/)
  assert.throws(() => executeCommand(state, { type: 'movement', productId: 1, kind: 'Entrada', quantity: 2, reason: '  ' }, 1), /motivo/)
  const next = executeCommand(state, { type: 'movement', productId: 1, kind: 'Entrada', quantity: 2, reason: 'Receiving' }, 1)
  assert.equal(next.movements[0].next, next.movements[0].previous + 2)
})

test('discrepancy resolution uses a confirmed recount against current stock', () => {
  let state = withOpenCash()
  const discrepancy = state.discrepancies[0]
  state = executeCommand(state, { type: 'sale', cashShiftId: openCashShift(state).id, items: [{ productId: discrepancy.productId, quantity: 1 }] }, 1)
  const next = executeCommand(state, { type: 'resolve', id: discrepancy.id, counted: 21, resolution: 'Recount confirmed' }, 1)
  assert.equal(next.products.find(product => product.id === discrepancy.productId).stock, 21)
  assert.equal(next.movements[0].previous, 23)
  assert.equal(next.movements[0].quantity, -2)
  assert.equal(next.discrepancies[0].resolvedStock, 21)
  assert.throws(() => executeCommand(next, { type: 'resolve', id: discrepancy.id, counted: 21, resolution: 'Again' }, 1), /resuelta/)
})

test('sales folios restart the sequence for a new year', () => {
  const state = withOpenCash()
  const year = new Date().getFullYear() + 1
  const next = executeCommand(state, { type: 'sale', cashShiftId: openCashShift(state).id, items: [{ productId: 1, quantity: 1 }] }, 1, `${year}-02-01T12:00:00.000Z`)
  assert.equal(next.sales[0].folio, `INV-${year}-0001`)
})

test('cash requires explicit funding and rejects sales outside the selected open shift', () => {
  const state = createDemoState()
  const items = [{ productId: 1, quantity: 1 }]
  assert.throws(() => executeCommand(state, { type: 'sale', cashShiftId: 'missing', items }, 2), /Abre un turno/)
  for (const openingBalance of [undefined, -1, 0.001]) {
    assert.throws(() => executeCommand(state, { type: 'openCash', openingBalance }, 2), /monto inicial/)
  }

  const opened = executeCommand(state, { type: 'openCash', openingBalance: 0 }, 2)
  const shift = openCashShift(opened)
  assert.equal(shift.openingBalance, 0)
  assert.throws(() => executeCommand(opened, { type: 'openCash', openingBalance: 0 }, 1), /Ya hay/)
  const sold = executeCommand(opened, { type: 'sale', cashShiftId: shift.id, items }, 2)
  assert.equal(sold.sales[0].cashShiftId, shift.id)

  const close = { type: 'closeCash', cashShiftId: shift.id, countedCash: 20 }
  assert.throws(() => executeCommand(sold, close, 2), /Administrador/)
  const closed = executeCommand(sold, close, 1)
  assert.equal(openCashShift(closed), undefined)
  assert.equal(closed.cashShifts[0].closing.countedCash, 20)
  assert.throws(() => executeCommand(closed, close, 1), /cerrado/)
  const reopened = executeCommand(closed, { type: 'openCash', openingBalance: 100 }, 1)
  assert.throws(() => executeCommand(reopened, { type: 'sale', cashShiftId: shift.id, items }, 2), /Abre un turno/)
})

test('cash cut groups product quantities and keeps historical prices', () => {
  const state = withOpenCash()
  const cashShiftId = openCashShift(state).id
  const sale = { type: 'sale', cashShiftId, items: [{ productId: 1, quantity: 1 }] }
  const first = executeCommand(state, sale, 2)
  const product = first.products.find(item => item.id === 1)
  const edited = executeCommand(first, { type: 'saveProduct', id: 1, values: { ...product, price: 25.01 } }, 1)
  const second = executeCommand(edited, sale, 2)
  const result = cashCut(second.sales.filter(item => item.cashShiftId === cashShiftId))
  assert.equal(result.salesCount, 2)
  assert.equal(result.total, 47.01)
  assert.equal(result.products[0].quantity, 2)
  assert.equal(result.products[0].total, 47.01)
  const expected = 100.25 + result.total
  assert.equal(cashDifference(147.26, expected), 0)
  assert.equal(cashDifference(147.25, expected), -0.01)
  assert.equal(cashDifference(147.27, expected), 0.01)
})
