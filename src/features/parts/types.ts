export const PART_CATEGORIES = [
  'Brakes',
  'Engine',
  'Suspension',
  'Electrical',
  'Filters',
  'Transmission',
] as const

export type PartCategory = (typeof PART_CATEGORIES)[number]

export interface Part {
  id: string
  sku: string
  name: string
  category: PartCategory
  price: number
  stock: number
  active: boolean
  updatedAt: string
  /** Optional — hosts the typeahead/autocomplete acceptance criterion on the form. */
  preferredSupplier?: string
}

export type PartInput = Omit<Part, 'id' | 'updatedAt'>

export type PartSortField = 'sku' | 'name' | 'category' | 'price' | 'stock' | 'updatedAt'

export type SortDirection = 'asc' | 'desc'

export interface Supplier {
  id: string
  name: string
}

export type CategoryFilter = PartCategory | 'All'
