export const money = (amount: number) => new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN',
}).format(amount)

export const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export const dateTime = (date: string) => new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(date))
export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const inDateRange = (date: string, from: string, to: string) => {
  const day = dayKey(new Date(date))
  return (!from || day >= from) && (!to || day <= to)
}
export const errorText = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la operación.'
