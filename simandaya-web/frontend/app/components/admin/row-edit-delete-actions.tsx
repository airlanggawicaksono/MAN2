"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";

interface RowEditDeleteActionsProps<T> {
  rowData: T;
  onEdit: (data: T) => void;
  onDelete: (data: T) => void;
}

export function RowEditDeleteActions<T>({
  rowData,
  onEdit,
  onDelete,
}: RowEditDeleteActionsProps<T>) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => onEdit(rowData)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(rowData)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function withActionsColumn<T>(
  columns: ColumnDef<T, unknown>[],
  onEdit: (item: T) => void,
  onDelete: (item: T) => void,
): ColumnDef<T, unknown>[] {
  return [
    ...columns,
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }: { row: { original: T } }) => (
        <RowEditDeleteActions
          rowData={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ),
    },
  ];
}

