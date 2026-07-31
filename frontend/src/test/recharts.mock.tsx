import type { ReactNode } from 'react'

type ChartProps = {
  children?: ReactNode
  data?: unknown[]
}

export const rechartsMock = {
  ResponsiveContainer: ({ children }: ChartProps) => <div>{children}</div>,
  BarChart: ({ children }: ChartProps) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }: ChartProps) => <div data-testid="line-chart">{children}</div>,
  CartesianGrid: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Bar: () => <div />,
  Line: () => <div />,
}
