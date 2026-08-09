import { describe, expect, it } from 'vitest'
import { buildPartsQueryParams } from './usePartsQuery'

describe('buildPartsQueryParams', () => {
  it('always includes pagination and sort params', () => {
    const params = buildPartsQueryParams({
      page: 2,
      pageSize: 25,
      sortField: 'price',
      sortDirection: 'desc',
      searchTerm: '',
      category: 'All',
    })

    expect(params).toEqual({ _page: 2, _limit: 25, _sort: 'price', _order: 'desc' })
  })

  it('adds q only when a search term is present, trimmed', () => {
    const withSearch = buildPartsQueryParams({
      page: 1,
      pageSize: 10,
      sortField: 'name',
      sortDirection: 'asc',
      searchTerm: '  brake  ',
      category: 'All',
    })
    expect(withSearch['q']).toBe('brake')

    const blankSearch = buildPartsQueryParams({
      page: 1,
      pageSize: 10,
      sortField: 'name',
      sortDirection: 'asc',
      searchTerm: '   ',
      category: 'All',
    })
    expect(blankSearch['q']).toBeUndefined()
  })

  it('adds category only when a specific category is selected', () => {
    const allCategories = buildPartsQueryParams({
      page: 1,
      pageSize: 10,
      sortField: 'name',
      sortDirection: 'asc',
      searchTerm: '',
      category: 'All',
    })
    expect(allCategories['category']).toBeUndefined()

    const filtered = buildPartsQueryParams({
      page: 1,
      pageSize: 10,
      sortField: 'name',
      sortDirection: 'asc',
      searchTerm: '',
      category: 'Brakes',
    })
    expect(filtered['category']).toBe('Brakes')
  })
})
