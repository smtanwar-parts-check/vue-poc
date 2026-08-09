import type { CategoryFilter, PartSortField, SortDirection } from './types'

export interface PartsQuery {
  page: number
  pageSize: number
  sortField: PartSortField
  sortDirection: SortDirection
  searchTerm: string
  category: CategoryFilter
}

/**
 * Pure translation from the store's query state to json-server's query-string
 * contract (`_page`, `_limit`, `_sort`, `_order`, `q`, field filters). Kept out
 * of the store so it's testable with zero Vue/HTTP machinery — same reasoning
 * as the Angular build's parts-query.ts.
 */
export function buildPartsQueryParams(query: PartsQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    _page: query.page,
    _limit: query.pageSize,
    _sort: query.sortField,
    _order: query.sortDirection,
  }

  const search = query.searchTerm.trim()
  if (search) {
    params['q'] = search
  }

  if (query.category !== 'All') {
    params['category'] = query.category
  }

  return params
}
