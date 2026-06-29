"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Column {
  key: string
  header: string
  render?: (item: Record<string, unknown>) => React.ReactNode
}

interface CounterpartyHistoryProps {
  data: Record<string, unknown>[]
  columns: Column[]
  emptyMessage: string
}

export function CounterpartyHistory({ data, columns, emptyMessage }: CounterpartyHistoryProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={item.id as string ?? index}>
            {columns.map((col) => (
              <TableCell key={col.key}>
                {col.render ? col.render(item) : (item[col.key] as React.ReactNode) ?? "\—"}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
