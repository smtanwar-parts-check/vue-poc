import { describe, expect, it } from 'vitest'
import { stockLevel } from './stockLevel'

describe('stockLevel', () => {
  it('classifies zero stock as out', () => {
    expect(stockLevel(0)).toBe('out')
  })

  it('classifies small positive stock as low', () => {
    expect(stockLevel(1)).toBe('low')
    expect(stockLevel(15)).toBe('low')
  })

  it('classifies healthy stock as ok', () => {
    expect(stockLevel(16)).toBe('ok')
    expect(stockLevel(300)).toBe('ok')
  })
})
