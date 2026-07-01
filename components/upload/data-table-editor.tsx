"use client"

import { useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Plus, Trash2, Hash, Type, ToggleLeft, Calendar } from "lucide-react"
import type { ColumnSchema } from "@/lib/file-parser"

interface DataTableEditorProps {
  columns: ColumnSchema[]
  rows: Record<string, any>[]
  totalRows: number
  onRowsChange: (rows: Record<string, any>[]) => void
}

const PAGE_SIZE = 25

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "number": return <Hash className="h-3 w-3" />
    case "boolean": return <ToggleLeft className="h-3 w-3" />
    case "date": return <Calendar className="h-3 w-3" />
    default: return <Type className="h-3 w-3" />
  }
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    number: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    boolean: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
    date: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
    string: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
  }
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[type] ?? colors.string}`}>
      <TypeIcon type={type} />
      {type}
    </span>
  )
}

export default function DataTableEditor({
  columns,
  rows,
  totalRows,
  onRowsChange,
}: DataTableEditorProps) {
  const [page, setPage] = useState(0)
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = useState("")

  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pagedRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const startEdit = (rowIndex: number, col: string, value: any) => {
    setEditingCell({ row: rowIndex, col })
    setEditValue(value === null || value === undefined ? "" : String(value))
  }

  const coerceValue = useCallback((value: string, colName: string) => {
    if (value === "") return null
    const col = columns.find((c) => c.name === colName)
    if (!col) return value
    if (col.type === "number") {
      const n = Number(value)
      return isNaN(n) ? value : n
    }
    if (col.type === "boolean") {
      const lower = value.toLowerCase()
      if (lower === "true") return true
      if (lower === "false") return false
      return value
    }
    return value
  }, [columns])

  const commitEdit = useCallback(() => {
    if (!editingCell) return
    const updated = [...rows]
    updated[editingCell.row] = {
      ...updated[editingCell.row],
      [editingCell.col]: coerceValue(editValue, editingCell.col),
    }
    onRowsChange(updated)
    setEditingCell(null)
  }, [editingCell, editValue, rows, onRowsChange, coerceValue])

  const addRow = () => {
    const emptyRow: Record<string, any> = {}
    columns.forEach((c) => (emptyRow[c.name] = null))
    const newRows = [...rows, emptyRow]
    onRowsChange(newRows)
    setPage(Math.ceil(newRows.length / PAGE_SIZE) - 1)
  }

  const deleteRow = (absoluteIndex: number) => {
    const updated = rows.filter((_, i) => i !== absoluteIndex)
    onRowsChange(updated)
    if (page > 0 && page * PAGE_SIZE >= updated.length) {
      setPage(page - 1)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Stats row */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{rows.length}</span> rows
          {totalRows > rows.length && (
            <span className="ml-1 text-amber-600 dark:text-amber-400">
              (showing first {rows.length} of {totalRows} total)
            </span>
          )}
          &nbsp;·&nbsp;
          <span className="font-semibold text-foreground">{columns.length}</span> columns
        </span>
        <Button variant="outline" size="sm" onClick={addRow} className="h-7 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add Row
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-10 text-center text-xs text-muted-foreground font-normal">#</TableHead>
                {columns.map((col) => (
                  <TableHead key={col.name} className="min-w-[120px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground text-sm">{col.name}</span>
                      <TypeBadge type={col.type} />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center text-muted-foreground py-8">
                    No data. Click &ldquo;Add Row&rdquo; to add a new record.
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((row, relIdx) => {
                  const absIdx = page * PAGE_SIZE + relIdx
                  return (
                    <TableRow key={absIdx} className="group">
                      <TableCell className="text-center text-xs text-muted-foreground">{absIdx + 1}</TableCell>
                      {columns.map((col) => {
                        const isEditing = editingCell?.row === absIdx && editingCell?.col === col.name
                        return (
                          <TableCell
                            key={col.name}
                            className="p-0"
                            onClick={() => !isEditing && startEdit(absIdx, col.name, row[col.name])}
                          >
                            {isEditing ? (
                              <Input
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitEdit()
                                  if (e.key === "Escape") setEditingCell(null)
                                }}
                                className="h-8 rounded-none border-0 border-b-2 border-primary focus-visible:ring-0 focus-visible:ring-offset-0 bg-primary/5 text-xs font-mono"
                              />
                            ) : (
                              <div className="px-4 py-2 text-sm cursor-pointer hover:bg-accent/50 min-h-[36px] flex items-center">
                                {row[col.name] === null || row[col.name] === undefined ? (
                                  <span className="text-muted-foreground/40 italic text-xs">null</span>
                                ) : (
                                  <span className="truncate max-w-[200px]">{String(row[col.name])}</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                        )
                      })}
                      <TableCell className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteRow(absIdx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
