import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'
import { EmptyState } from './EmptyState'
import { TableSkeleton } from './Skeleton'

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  headerClassName?: string
  cellClassName?: string
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  minWidthClass?: string
  isLoading?: boolean
  isFetching?: boolean
  emptyState: {
    icon: ReactNode
    title: string
    description?: string
    action?: ReactNode
  }
  skeletonRows?: number
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  minWidthClass = 'min-w-120',
  isLoading = false,
  isFetching = false,
  emptyState,
  skeletonRows = 6,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} />
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    )
  }

  return (
    <div
      className={cn(
        'overflow-x-auto transition-opacity',
        isFetching && 'opacity-70',
      )}
    >
      <table className={cn('w-full text-left text-sm', minWidthClass)}>
        <thead>
          <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn('px-3 py-3 font-medium', column.headerClassName)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border/40 transition-colors hover:bg-surface/40"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('px-3 py-3', column.cellClassName)}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
