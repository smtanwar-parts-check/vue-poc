export type StockLevel = 'out' | 'low' | 'ok'

const LOW_STOCK_THRESHOLD = 15

/** Pure classification used to color-code the stock column — encodes urgency, not just the number. */
export function stockLevel(stock: number): StockLevel {
  if (stock <= 0) {
    return 'out'
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return 'low'
  }
  return 'ok'
}
