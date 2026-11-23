import { useState } from 'react'
import { createDemoState, executeCommand } from './inventory-model'
import type { Command, InventoryState } from './inventory-model'

const storageKey = 'inventory-system-demo-v1'
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object'
const text = (value: unknown) => typeof value === 'string'
const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

function validState(value: unknown): value is InventoryState {
  if (!record(value) || value.version !== 1) return false
  const { products, users, sales, movements, discrepancies, cashShifts } = value
  return Array.isArray(products) && products.every(p => record(p) && number(p.id) && text(p.name) && text(p.description) && number(p.price) && p.price >= 0 && number(p.stock) && Number.isInteger(p.stock) && p.stock >= 0 && typeof p.active === 'boolean' && (p.barcode === undefined || text(p.barcode))) &&
    Array.isArray(users) && users.some(u => record(u) && u.role === 'Administrador' && u.active === true) && users.every(u => record(u) && number(u.id) && text(u.name) && text(u.email) && ['Administrador', 'Vendedor'].includes(String(u.role)) && typeof u.active === 'boolean') &&
    Array.isArray(cashShifts) && cashShifts.every(s =>
      record(s) && text(s.id) && number(s.openedByUserId) && text(s.openedBy) &&
      text(s.openedAt) && !isNaN(Date.parse(s.openedAt)) && number(s.openingBalance) && s.openingBalance >= 0 &&
      (s.closing === undefined || (record(s.closing) && text(s.closing.date) && !isNaN(Date.parse(s.closing.date)) &&
        number(s.closing.userId) && text(s.closing.userName) && number(s.closing.countedCash) && s.closing.countedCash >= 0))) &&
    cashShifts.filter(s => !s.closing).length <= 1 &&
    Array.isArray(sales) && sales.every(s => record(s) && text(s.id) && text(s.folio) && text(s.date) && !isNaN(Date.parse(s.date)) && number(s.total) && number(s.userId) && text(s.userName) && (s.cashShiftId === undefined || cashShifts.some(shift => shift.id === s.cashShiftId)) && Array.isArray(s.items) && s.items.every(i => record(i) && number(i.productId) && text(i.name) && number(i.price) && number(i.quantity))) &&
    Array.isArray(movements) && movements.every(m => record(m) && text(m.id) && text(m.date) && !isNaN(Date.parse(m.date)) && number(m.productId) && text(m.productName) && ['Entrada', 'Salida', 'Venta', 'Ajuste'].includes(String(m.type)) && number(m.quantity) && number(m.previous) && number(m.next) && text(m.reason) && text(m.userName) && number(m.userId)) &&
    Array.isArray(discrepancies) && discrepancies.every(d => record(d) && text(d.id) && text(d.date) && !isNaN(Date.parse(d.date)) && number(d.productId) && text(d.productName) && number(d.expected) && number(d.counted) && text(d.reason) && text(d.userName) && typeof d.resolved === 'boolean')
}

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const raw: unknown = JSON.parse(saved)
      const parsed = record(raw) && !('cashShifts' in raw) ? { ...raw, cashShifts: [] } : raw
      if (validState(parsed)) return { state: parsed, warning: '' }
      return { state: createDemoState(), warning: 'Los datos locales no eran compatibles. Se cargó una nueva demostración.' }
    }
    return { state: createDemoState(), warning: '' }
  } catch {
    return { state: createDemoState(), warning: 'No se pudieron recuperar los datos locales. Esta sesión usa una nueva demostración.' }
  }
}

export function useInventory() {
  const [loaded] = useState(loadState)
  const [state, setState] = useState(loaded.state)
  const [storageWarning, setStorageWarning] = useState(loaded.warning)
  const [userId, setUserId] = useState<number | null>(1)
  const user = state.users.find(item => item.id === userId && item.active)

  function run(command: Command) {
    if (!user) throw new Error('Selecciona un usuario activo para continuar.')
    const next = executeCommand(state, command, user.id)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) }
    catch { setStorageWarning('El navegador no permite guardar los datos. Los cambios se perderán al cerrar o recargar.') }
    setState(next)
    return next
  }

  return { state, user, isAdmin: user?.role === 'Administrador', storageWarning, run, selectUser: setUserId }
}

export type InventoryController = ReturnType<typeof useInventory>
