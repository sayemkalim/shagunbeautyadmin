import React, { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Typography from "@/components/typography";
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { Checkbox } from "../ui/checkbox";

function CustomTable({
  columns: rawColumns,
  data,
  isLoading,
  error,
  totalPages = 1,
  currentPage = 1,
  perPage = 10,
  onPageChange,
  emptyStateMessage = "No records available.",
  enableRowSelection = false,
  selectedRows = [],
  onRowSelectionChange,
  getRowId,
  hidePagination = false,
}) {
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo(() => {
    const baseColumns = rawColumns.map((col) => ({
      id: col.key,
      accessorKey: col.key,
      header: () => (
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {col.label}
        </span>
      ),
      cell: (info) =>
        col.render ? (
          col.render(info.getValue(), info.row.original)
        ) : (
          <Typography>{info.getValue()}</Typography>
        ),
    }));

    if (enableRowSelection) {
      return [
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => {
                table.toggleAllPageRowsSelected(!!value);
              }}
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => {
                row.toggleSelected(!!value);
              }}
              aria-label="Select row"
            />
          ),
        },
        ...baseColumns,
      ];
    }
    return baseColumns;
  }, [rawColumns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns,
    getRowId: getRowId || ((row, index) => row._id || `${index}`),
    state: {
      sorting,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: perPage,
      },
      rowSelection,
    },
    manualPagination: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    if (onRowSelectionChange && enableRowSelection) {
      const selectedRowIds = Object.keys(rowSelection);
      const currentSelectedSet = new Set(selectedRows);
      const hasChanges =
        selectedRowIds.length !== selectedRows.length ||
        !selectedRowIds.every((id) => currentSelectedSet.has(id));

      if (hasChanges) {
        onRowSelectionChange(selectedRowIds);
      }
    }
  }, [rowSelection, onRowSelectionChange, enableRowSelection]);
  useEffect(() => {
    if (enableRowSelection && selectedRows) {
      const newSelection = {};
      selectedRows.forEach((id) => {
        newSelection[id] = true;
      });

      const currentKeys = Object.keys(rowSelection);
      const isDifferent =
        currentKeys.length !== selectedRows.length ||
        !currentKeys.every((key) => newSelection[key]);

      if (isDifferent) {
        setRowSelection(newSelection);
      }
    }
  }, [selectedRows, enableRowSelection]);

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="mb-4 h-10 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="mb-2 h-11 w-full" />
        ))}
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <Inbox className="size-5" />
        </div>
        <Typography variant="p" className="text-muted-foreground">
          {emptyStateMessage}
        </Typography>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="bg-muted/40 h-11 cursor-pointer px-4 py-3 select-none"
                >
                  <div className="group flex items-center gap-1.5">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() === "asc" && (
                      <ArrowUp size={13} className="text-primary" />
                    )}
                    {header.column.getIsSorted() === "desc" && (
                      <ArrowDown size={13} className="text-primary" />
                    )}
                    {!header.column.getIsSorted() && header.column.getCanSort() && (
                      <ArrowUpDown size={13} className="text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!hidePagination && (
        <Pagination className="border-t px-4 py-3">
          <PaginationContent>
            {/* Previous Button */}
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) onPageChange(currentPage - 1);
                }}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {/* First Page */}
            {currentPage > 3 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(1);
                    }}
                    isActive={currentPage === 1}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              </>
            )}

            {/* Page Range */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                return (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                );
              })
              .map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(page);
                    }}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}


            {currentPage < totalPages - 2 && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(totalPages);
                    }}
                    isActive={currentPage === totalPages}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            {/* Next Button */}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) onPageChange(currentPage + 1);
                }}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </Card>
  );
}

export default CustomTable;
