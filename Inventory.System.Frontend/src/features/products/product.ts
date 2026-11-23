export interface Product {
  id: number
  name: string
  description: string
  barcode?: string
  price: number
  stock: number
  active: boolean
}

export type ProductValues = Omit<Product, 'id'>

const sampleProducts: Product[] = [
  { id: 1, name: 'Coca-Cola original 600 ml', description: 'Refresco de cola · Botella individual', price: 22, stock: 48, active: true },
  { id: 2, name: 'Agua Ciel 1 L', description: 'Agua purificada · Botella individual', price: 16, stock: 36, active: true },
  { id: 3, name: 'Sabritas original 45 g', description: 'Papas fritas con sal · Bolsa individual', price: 19.5, stock: 24, active: true },
  { id: 4, name: 'Leche Lala entera 1 L', description: 'Leche ultrapasteurizada · Tetra Pak', price: 29, stock: 12, active: true },
  { id: 5, name: 'Galletas Marías 170 g', description: 'Galletas de vainilla · Paquete', price: 18, stock: 0, active: true },
  { id: 6, name: 'Café soluble Nescafé 120 g', description: 'Café clásico · Frasco de vidrio', price: 89, stock: 8, active: true },
  { id: 7, name: 'Atún Dolores 140 g', description: 'Atún en agua · Lata', price: 24.5, stock: 18, active: true },
  { id: 8, name: 'Jugo Del Valle 413 ml', description: 'Néctar de mango · Botella individual', price: 17, stock: 0, active: false },
  { id: 9, name: 'Arroz Verde Valle 1 kg', description: 'Arroz blanco · Bolsa', price: 34, stock: 15, active: true },
  { id: 10, name: 'Aceite Nutrioli 850 ml', description: 'Aceite de soya · Botella', price: 42, stock: 10, active: false },
  { id: 11, name: 'Azúcar estándar 1 kg', description: 'Azúcar de caña · Bolsa', price: 32, stock: 20, active: true },
  { id: 12, name: 'Frijol La Sierra 430 g', description: 'Frijoles refritos bayos · Lata', price: 21, stock: 16, active: true },
]

export const initialProducts = sampleProducts.map(product => ({
  ...product,
  barcode: `750100000${String(product.id).padStart(4, '0')}`,
}))
