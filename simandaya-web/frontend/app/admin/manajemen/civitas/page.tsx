"use client";

import { useState } from "react";
import {
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useListTeachersQuery } from "@/api/admin/teachers";
import type { GuruProfile } from "@/types/teachers";
import { useTeacherPrecache } from "@/hooks/useTeacherPrecache";
import { useDebounce } from "@/hooks/useDebounce";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeacherForm } from "./teacher-form";
import { teacherColumns } from "./teacher-columns";
import { TeacherEditDialog } from "./teacher-edit-dialog";
import { TeacherDeleteDialog } from "./teacher-delete-dialog";

const LIMIT = 30;

export default function CivitasAkademikPage() {
  const [skip, setSkip] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data, isLoading, error } = useListTeachersQuery({
    skip,
    limit: LIMIT,
    search: debouncedSearch || undefined,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const currentPage = Math.floor(skip / LIMIT) + 1;

  useTeacherPrecache(skip, total, debouncedSearch || undefined);

  const [editTarget, setEditTarget] = useState<GuruProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GuruProfile | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSkip(0);
  };

  const columnsWithActions = [
    ...teacherColumns,
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }: { row: { original: GuruProfile } }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditTarget(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Data Civitas Akademik</h1>
        <p className="mt-1 text-muted-foreground">
          Kelola data guru dan tenaga kependidikan MAN 2 Kota Yogyakarta
        </p>
      </div>

      <TeacherForm />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Daftar Civitas Akademik</h2>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari civitas..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading && <p className="text-muted-foreground">Memuat data...</p>}
        {error && (
          <p className="text-destructive">
            Gagal memuat data civitas: {JSON.stringify(error)}
          </p>
        )}
        {data && <DataTable columns={columnsWithActions} data={data.items} />}

        {data && total > LIMIT && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Menampilkan {skip + 1}-{Math.min(skip + LIMIT, total)} dari{" "}
              {total} civitas
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={skip === 0}
                onClick={() => setSkip((s) => Math.max(0, s - LIMIT))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Prev
              </Button>
              <span className="text-sm">
                Hal {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={skip + LIMIT >= total}
                onClick={() => setSkip((s) => s + LIMIT)}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <TeacherEditDialog
        teacher={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />

      <TeacherDeleteDialog
        teacher={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
