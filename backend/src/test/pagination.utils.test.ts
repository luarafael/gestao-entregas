import { describe, it, expect } from 'vitest'
import { buildPaginatedResult, getPaginationParams } from '../utils/pagination.utils.js'

describe('pagination.utils', () => {
  it('should normalize pagination params', () => {
    expect(getPaginationParams(0, 200)).toEqual({ page: 1, limit: 100 })
    expect(getPaginationParams(2, 10)).toEqual({ page: 2, limit: 10 })
  })

  it('should build paginated result', () => {
    const result = buildPaginatedResult(['a', 'b'], 25, 2, 10)

    expect(result.data).toHaveLength(2)
    expect(result.meta).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    })
  })
})
