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
  tableClassName?: string
  compact?: boolean
  scrollable?: boolean
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
  minWidthClass,
  tableClassName,
  compact = false,
  scrollable = true,
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

  const cellPadding = compact ? 'px-2 py-2' : 'px-3 py-3'

  return (
    <div
      className={cn(
        'transition-opacity',
        scrollable ? 'overflow-x-auto' : 'overflow-hidden',
        isFetching && 'opacity-70',
      )}
    >
      <table
        className={cn(
          'w-full text-left',
          compact ? 'table-fixed text-xs' : 'text-sm',
          minWidthClass,
          tableClassName,
        )}
      >
        <thead>
          <tr className="border-b border-border/60 text-[10px] uppercase tracking-wide text-muted-foreground">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(cellPadding, 'font-medium', column.headerClassName)}
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
                  className={cn(cellPadding, column.cellClassName)}
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
