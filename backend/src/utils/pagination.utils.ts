export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function getPaginationParams(
  page = 1,
  limit = 10,
): PaginationParams {
  const safePage = Math.max(1, page)
  const safeLimit = Math.min(100, Math.max(1, limit))

  return { page: safePage, limit: safeLimit }
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}
