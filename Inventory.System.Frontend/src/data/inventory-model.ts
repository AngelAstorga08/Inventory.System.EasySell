import { initialProducts } from '../features/products/product.ts'
import type { Product, ProductValues } from '../features/products/product.ts'

export interface User {
  id: number
  name: string
  email: string
  role: 'Administrador' | 'Vendedor'
  active: boolean
}
export type UserValues = Omit<User, 'id'>
export interface SaleItem { productId: number; name: string; quantity: number; price: number }
export interface Sale { id: string; folio: string; date: string; userId: number; userName: string; items: SaleItem[]; total: number; cashShiftId?: string }
export interface CashShift {
  id: string
  openedAt: string
  openedByUserId: number
  openedBy: string
  openingBalance: number
  closing?: { date: string; userId: number; userName: string; countedCash: number }
}
export interface Movement {
  id: string; date: string; productId: number; productName: string
  type: 'Entrada' | 'Salida' | 'Venta' | 'Ajuste'
  quantity: number; previous: number; next: number; reason: string
  userId: number; userName: string; saleId?: string
}
export interface Discrepancy {
  id: string; date: string; productId: number; productName: string
  expected: number; counted: number; reason: string; userName: string
  resolved: boolean; resolvedAt?: string; resolution?: string; resolvedStock?: number
}
export interface InventoryState {
  version: 1
  products: Product[]; users: User[]; sales: Sale[]; movements: Movement[]; discrepancies: Discrepancy[]
  cashShifts: CashShift[]
}
export type Command =
  | { type: 'saveProduct'; values: ProductValues; id?: number }
  | { type: 'toggleProduct'; id: number }
  | { type: 'sale'; cashShiftId: string; items: { productId: number; quantity: number }[] }
  | { type: 'openCash'; openingBalance: number }
  | { type: 'closeCash'; cashShiftId: string; countedCash: number }
  | { type: 'movement'; productId: number; kind: 'Entrada' | 'Salida'; quantity: number; reason: string }
  | { type: 'saveUser'; values: UserValues; id?: number }
  | { type: 'toggleUser'; id: number }
  | { type: 'discrepancy'; productId: number; counted: number; reason: string }
  | { type: 'resolve'; id: string; resolution: string; counted: number }

const id = () => crypto.randomUUID()
const requireValue = (condition: unknown, message: string) => { if (!condition) throw new Error(message) }
const integer = (value: number) => Number.isSafeInteger(value) && value >= 0
const round = (value: number) => Math.round(value * 100) / 100
const validCash = (value: number) => integer(Math.round(value * 100)) && value >= 0 && round(value) === value

export const openCashShift = (state: InventoryState) => state.cashShifts.find(shift => !shift.closing)
export const cashDifference = (counted: number, expected: number) =>
  (Math.round(counted * 100) - Math.round(expected * 100)) / 100

export function cashCut(sales: Sale[]) {
  const products = new Map<number, { productId: number; name: string; quantity: number; cents: number }>()
  for (const sale of sales) {
    for (const item of sale.items) {
      const row = products.get(item.productId) ?? { productId: item.productId, name: item.name, quantity: 0, cents: 0 }
      row.quantity += item.quantity
      row.cents += Math.round(item.price * 100) * item.quantity
      products.set(item.productId, row)
    }
  }
  return {
    salesCount: sales.length,
    total: sales.reduce((sum, sale) => sum + Math.round(sale.total * 100), 0) / 100,
    products: [...products.values()].map(({ cents, ...product }) => ({ ...product, total: cents / 100 })),
  }
}

export function executeCommand(state: InventoryState, command: Command, userId: number, date = new Date().toISOString()): InventoryState {
  const user = state.users.find(item => item.id === userId)
  requireValue(user?.active, 'Este usuario está desactivado. Cambia de usuario para continuar.')
  const actor = user!
  const admin = () => requireValue(actor.role === 'Administrador', 'Esta acción requiere el rol Administrador.')
  const productFor = (productId: number) => {
    const product = state.products.find(item => item.id === productId)
    requireValue(product, 'El producto no existe.')
    return product!
  }
  const movement = (product: Product, quantity: number, type: Movement['type'], reason: string, saleId?: string): Movement => ({
    id: id(), date, productId: product.id, productName: product.name, quantity,
    previous: product.stock, next: product.stock + quantity, type, reason,
    userId: actor.id, userName: actor.name, saleId,
  })
  switch (command.type) {
    case 'saveProduct': {
      admin()
      const values = command.values
      requireValue(values.name.trim(), 'El nombre es obligatorio.')
      requireValue(Number.isFinite(values.price) && values.price >= 0, 'El precio debe ser igual o mayor a cero.')
      requireValue(integer(values.stock), 'Las existencias deben ser un entero igual o mayor a cero.')
      const barcode = values.barcode?.trim() || ''
      requireValue(!barcode || /^\d{8,14}$/.test(barcode), 'El código debe contener de 8 a 14 dígitos.')
      requireValue(!barcode || !state.products.some(item => item.id !== command.id && item.barcode === barcode), 'Este código de barras ya pertenece a otro producto.')
      const previous = command.id === undefined ? undefined : productFor(command.id)
      const product: Product = { ...values, id: previous?.id ?? Math.max(0, ...state.products.map(item => item.id)) + 1, name: values.name.trim(), description: values.description?.trim() || '', barcode, price: round(values.price), stock: previous?.stock ?? values.stock }
      const initial = !previous && product.stock > 0 ? movement({ ...product, stock: 0 }, product.stock, 'Entrada', 'Existencias iniciales al crear producto') : undefined
      return { ...state, products: previous ? state.products.map(item => item.id === product.id ? product : item) : [product, ...state.products], movements: initial ? [initial, ...state.movements] : state.movements }
    }
    case 'toggleProduct': {
      admin()
      const product = productFor(command.id)
      return { ...state, products: state.products.map(item => item.id === product.id ? { ...item, active: !item.active } : item) }
    }
    case 'openCash': {
      requireValue(!openCashShift(state), 'Ya hay un turno de caja abierto.')
      requireValue(validCash(command.openingBalance), 'Ingresa un monto inicial de cero o más, con hasta dos decimales.')
      const shift: CashShift = { id: id(), openedAt: date, openedByUserId: actor.id, openedBy: actor.name, openingBalance: command.openingBalance }
      return { ...state, cashShifts: [shift, ...state.cashShifts] }
    }
    case 'closeCash': {
      admin()
      const shift = openCashShift(state)
      requireValue(shift && shift.id === command.cashShiftId, 'El turno de caja ya está cerrado o no existe.')
      requireValue(validCash(command.countedCash), 'Ingresa el efectivo contado, de cero o más, con hasta dos decimales.')
      const closing = { date, userId: actor.id, userName: actor.name, countedCash: command.countedCash }
      return { ...state, cashShifts: state.cashShifts.map(item => item.id === command.cashShiftId ? { ...item, closing } : item) }
    }
    case 'sale': {
      const shift = openCashShift(state)
      requireValue(shift && shift.id === command.cashShiftId, 'Abre un turno de caja para registrar la venta.')
      requireValue(command.items.length, 'Agrega al menos un producto a la venta.')
      const quantities = new Map<number, number>()
      for (const line of command.items) {
        requireValue(integer(line.quantity) && line.quantity > 0, 'La cantidad debe ser un entero mayor a cero.')
        quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity)
      }
      const items: SaleItem[] = [...quantities].map(([productId, quantity]) => {
        const product = productFor(productId)
        requireValue(product.active, `${product.name} está desactivado.`)
        requireValue(product.stock >= quantity, `Existencias insuficientes para ${product.name}.`)
        return { productId, name: product.name, price: product.price, quantity }
      })
      const year = new Date(date).getFullYear()
      const sequence = state.sales.filter(sale => new Date(sale.date).getFullYear() === year).length + 1
      const sale: Sale = { id: id(), folio: `INV-${year}-${String(sequence).padStart(4, '0')}`, date, userId: actor.id, userName: actor.name, cashShiftId: command.cashShiftId, items, total: items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100 }
      return { ...state,
        sales: [sale, ...state.sales],
        products: state.products.map(product => ({ ...product, stock: product.stock - (quantities.get(product.id) ?? 0) })),
        movements: [...items.map(item => movement(productFor(item.productId), -item.quantity, 'Venta', sale.folio, sale.id)), ...state.movements],
      }
    }
    case 'movement': {
      admin()
      const product = productFor(command.productId)
      requireValue(product.active, 'Activa el producto antes de registrar movimientos.')
      requireValue(integer(command.quantity) && command.quantity > 0, 'La cantidad debe ser un entero mayor a cero.')
      requireValue(command.reason.trim(), 'El motivo es obligatorio.')
      const quantity = command.kind === 'Entrada' ? command.quantity : -command.quantity
      requireValue(product.stock + quantity >= 0, 'No hay existencias suficientes para esta salida.')
      return { ...state, products: state.products.map(item => item.id === product.id ? { ...item, stock: item.stock + quantity } : item), movements: [movement(product, quantity, command.kind, command.reason.trim()), ...state.movements] }
    }
    case 'saveUser': {
      admin()
      const values = command.values
      requireValue(values.name.trim(), 'El nombre es obligatorio.')
      requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()), 'Escribe un correo válido.')
      requireValue(['Administrador', 'Vendedor'].includes(values.role), 'Selecciona un rol válido.')
      requireValue(!state.users.some(item => item.id !== command.id && item.email.toLowerCase() === values.email.trim().toLowerCase()), 'Este correo ya está registrado.')
      requireValue(command.id === undefined || state.users.some(item => item.id === command.id), 'El usuario no existe.')
      requireValue(command.id !== actor.id || (values.active && values.role === 'Administrador'), 'No puedes desactivar tu propia cuenta ni quitarte el rol Administrador.')
      const user: User = { ...values, id: command.id ?? Math.max(0, ...state.users.map(item => item.id)) + 1, name: values.name.trim(), email: values.email.trim().toLowerCase() }
      return { ...state, users: command.id ? state.users.map(item => item.id === user.id ? user : item) : [user, ...state.users] }
    }
    case 'toggleUser': {
      admin()
      requireValue(command.id !== actor.id, 'No puedes desactivar tu propia cuenta.')
      requireValue(state.users.some(item => item.id === command.id), 'El usuario no existe.')
      return { ...state, users: state.users.map(item => item.id === command.id ? { ...item, active: !item.active } : item) }
    }
    case 'discrepancy': {
      admin()
      const product = productFor(command.productId)
      requireValue(product.active, 'Selecciona un producto activo.')
      requireValue(integer(command.counted), 'El conteo debe ser un entero igual o mayor a cero.')
      requireValue(command.counted !== product.stock, 'El conteo coincide con las existencias. No hay discrepancia.')
      requireValue(command.reason.trim(), 'Explica el motivo de la discrepancia.')
      requireValue(!state.discrepancies.some(item => item.productId === product.id && !item.resolved), 'Este producto ya tiene una discrepancia pendiente.')
      const discrepancy: Discrepancy = { id: id(), date, productId: product.id, productName: product.name, expected: product.stock, counted: command.counted, reason: command.reason.trim(), userName: actor.name, resolved: false }
      return { ...state, discrepancies: [discrepancy, ...state.discrepancies] }
    }
    case 'resolve': {
      admin()
      const discrepancy = state.discrepancies.find(item => item.id === command.id)
      requireValue(discrepancy && !discrepancy.resolved, 'La discrepancia no existe o ya fue resuelta.')
      requireValue(command.resolution.trim(), 'Describe la resolución.')
      const current = discrepancy!
      const product = productFor(current.productId)
      requireValue(integer(command.counted), 'Confirma un conteo físico entero igual o mayor a cero.')
      const change = command.counted - product.stock
      return { ...state,
        products: state.products.map(item => item.id === product.id ? { ...item, stock: command.counted } : item),
        movements: [movement(product, change, 'Ajuste', `Conciliación: ${command.resolution.trim()}`), ...state.movements],
        discrepancies: state.discrepancies.map(item => item.id === command.id ? { ...item, resolved: true, resolvedAt: date, resolution: command.resolution.trim(), resolvedStock: command.counted } : item),
      }
    }
  }
}

export function createDemoState(): InventoryState {
  const users: User[] = [
    { id: 1, name: 'Ángel Astorga', email: 'angel@inventario.demo', role: 'Administrador', active: true },
    { id: 2, name: 'María López', email: 'maria@inventario.demo', role: 'Vendedor', active: true },
    { id: 3, name: 'Luis García', email: 'luis@inventario.demo', role: 'Vendedor', active: false },
  ]
  let state: InventoryState = { version: 1, products: initialProducts.map(product => ({ ...product, stock: 0 })), users, sales: [], movements: [], discrepancies: [], cashShifts: [] }
  const batches = [[1, 3], [2, 4], [3, 2], [1, 2], [4, 1], [6, 1], [7, 2]]
  const seedDate = (days: number, hour: number) => { const date = new Date(); date.setDate(date.getDate() - days); date.setHours(hour, 15, 0, 0); return date.toISOString() }
  for (const product of initialProducts.filter(item => item.stock > 0)) {
    const sold = batches.filter(([productId]) => productId === product.id).reduce((sum, [, quantity]) => sum + quantity, 0)
    const quantity = product.stock + sold
    state.products = state.products.map(item => item.id === product.id ? { ...item, stock: quantity } : item)
    state.movements.unshift({ id: id(), date: seedDate(7, 8), productId: product.id, productName: product.name, type: 'Entrada', quantity, previous: 0, next: quantity, reason: 'Carga inicial de demostración', userId: 1, userName: users[0].name })
  }
  batches.forEach(([productId, quantity], index) => {
    const days = Math.max(0, 5 - index)
    const hour = 9 + index
    state = executeCommand(state, { type: 'openCash', openingBalance: 0 }, 1, seedDate(days, hour - 1))
    const cashShiftId = state.cashShifts[0].id
    state = executeCommand(state, { type: 'sale', cashShiftId, items: [{ productId, quantity }] }, index % 2 ? 2 : 1, seedDate(days, hour))
    state = executeCommand(state, { type: 'closeCash', cashShiftId, countedCash: state.sales[0].total }, 1, seedDate(days, hour))
  })
  state = executeCommand(state, { type: 'discrepancy', productId: 3, counted: 22, reason: 'Diferencia detectada en conteo de estante (ejemplo).' }, 1)
  return state
}
