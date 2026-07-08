import { useMemo, useState } from "react";
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable, type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ChevronLeft, Search, Inbox, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";

export interface StatusOption { value: string; label: string; }

interface Props<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[] | undefined;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchKey?: string;
  emptyText?: string;
  statusOptions?: StatusOption[];
  statusKey?: string;
  toolbar?: React.ReactNode;
}

export function DataTable<T>({
  columns, data, isLoading, searchPlaceholder = "بحث...", searchKey,
  emptyText = "لا توجد بيانات", statusOptions, statusKey = "status", toolbar,
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const filteredData = useMemo(() => {
    let rows = data ?? [];
    if (statusOptions && statusFilter !== "all") {
      rows = rows.filter((r) => String((r as Record<string, unknown>)[statusKey] ?? "") === statusFilter);
    }
    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate).getTime() : -Infinity;
      const to = toDate ? new Date(toDate).getTime() + 86400000 : Infinity;
      rows = rows.filter((r) => {
        const rec = r as Record<string, unknown>;
        const dateVal = Object.entries(rec).find(([k]) => /At$|Date$/i.test(k))?.[1];
        if (!dateVal) return true;
        const t = new Date(String(dateVal)).getTime();
        return !isNaN(t) && t >= from && t <= to;
      });
    }
    return rows;
  }, [data, statusFilter, statusOptions, statusKey, fromDate, toDate]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _colId, value) => {
      if (!value) return true;
      const v = String(value).toLowerCase();
      if (searchKey) {
        return String(row.getValue(searchKey) ?? "").toLowerCase().includes(v);
      }
      return Object.values(row.original as Record<string, unknown>).some((cell) =>
        String(cell ?? "").toLowerCase().includes(v),
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="pr-9"
          />
        </div>
        {statusOptions && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-1">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36" aria-label="من تاريخ" />
          <span className="text-xs text-muted-foreground">إلى</span>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-36" aria-label="إلى تاريخ" />
        </div>
        {toolbar && <div className="ms-auto flex items-center gap-2">{toolbar}</div>}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/50">
                {hg.headers.map((h) => {
                  const canSort = h.column.getCanSort();
                  const sortDir = h.column.getIsSorted();
                  return (
                    <TableHead key={h.id} className="text-right font-semibold">
                      {h.isPlaceholder ? null : (
                        <button
                          type="button"
                          disabled={!canSort}
                          onClick={h.column.getToggleSortingHandler()}
                          className={`inline-flex items-center gap-1 ${canSort ? "hover:text-primary" : "cursor-default"}`}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {canSort && (
                            sortDir === "asc" ? <ArrowUp className="size-3" /> :
                            sortDir === "desc" ? <ArrowDown className="size-3" /> :
                            <ChevronsUpDown className="size-3 opacity-40" />
                          )}
                        </button>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_c, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="size-8" />
                    <span>{emptyText}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount() || 1}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronRight className="size-4" /> السابق
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            التالي <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
