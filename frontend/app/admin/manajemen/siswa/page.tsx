"use client";

import { Upload, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StudentEditDialog } from "./student-edit-dialog";
import { StudentDeleteDialog } from "./student-delete-dialog";
import { StudentCreateDialog } from "./student-create-dialog";
import { StudentImportDialog } from "./student-import-dialog";
import { EntitySearchInput } from "@/app/components/admin/entity-search-input";
import { AdminPageShell } from "@/app/components/admin/admin-page-shell";
import { BulkActionBar } from "@/app/components/admin/bulk-action-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { EntityExportDialog } from "@/app/components/admin/entity-export-dialog";
import { ExportActionButtons } from "@/app/components/admin/export-action-buttons";
import { StudentTabPanel } from "./student-tab-panel";
import { useSiswaManagementController } from "@/hooks/admin/manajemen/use-siswa-management-controller";

export default function DataSiswaPage() {
  const {
    crudAktif,
    crudAlumni,
    activeTab,
    handleTabChange,
    crud,
    showCreate,
    setShowCreate,
    showImport,
    setShowImport,
    selectedIds,
    setSelectedIds,
    bulkConfirmDelete,
    setBulkConfirmDelete,
    bulkConfirmAlumni,
    setBulkConfirmAlumni,
    bulkConfirmRevert,
    setBulkConfirmRevert,
    deletingBulk,
    updatingBulk,
    handleToggle,
    handleToggleAll,
    handleBulkDelete,
    handleBulkAlumni,
    handleBulkRevert,
    bulkActions,
    exporter,
  } = useSiswaManagementController();

  return (
    <AdminPageShell
      eyebrow="Manajemen Data"
      title="Data Siswa"
      description="Kelola profil siswa MAN 2 Yogyakarta - tambah, ubah, dan tandai alumni."
      actions={
        <>
          <ExportActionButtons onTrigger={exporter.open} disabled={exporter.exporting} />
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Impor CSV/XLSX
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Siswa
          </Button>
        </>
      }
    >
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 h-9 rounded-lg bg-muted/60 p-1">
          <TabsTrigger value="aktif" className="rounded-md px-4 text-sm">
            Siswa Aktif
          </TabsTrigger>
          <TabsTrigger value="alumni" className="rounded-md px-4 text-sm">
            Alumni
          </TabsTrigger>
        </TabsList>

        {(["aktif", "alumni"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <Card className="border-border/70">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  {tab === "aktif" ? "Daftar Siswa Aktif" : "Daftar Alumni"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EntitySearchInput
                  placeholder={`Cari ${tab === "aktif" ? "siswa" : "alumni"} (NISN/Nama)...`}
                  value={(tab === "aktif" ? crudAktif : crudAlumni).searchInput}
                  onChange={(tab === "aktif" ? crudAktif : crudAlumni).handleSearchChange}
                />
                <StudentTabPanel
                  tab={tab}
                  crud={tab === "aktif" ? crudAktif : crudAlumni}
                  selectedIds={selectedIds}
                  onToggle={handleToggle}
                  onToggleAll={handleToggleAll}
                  onEdit={crud.setEditTarget}
                  onDelete={crud.setDeleteTarget}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <BulkActionBar
        selectedCount={selectedIds.size}
        actions={bulkActions}
        onClear={() => setSelectedIds(new Set())}
      />

      <StudentCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      <StudentImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
      />

      <StudentEditDialog
        student={crud.editTarget}
        open={!!crud.editTarget}
        onClose={() => crud.setEditTarget(null)}
      />

      <StudentDeleteDialog
        student={crud.deleteTarget}
        open={!!crud.deleteTarget}
        onClose={() => crud.setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkConfirmDelete}
        onOpenChange={setBulkConfirmDelete}
        title="Hapus Siswa Terpilih"
        description={`${selectedIds.size} data siswa akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={deletingBulk ? "Menghapus..." : `Hapus ${selectedIds.size} Siswa`}
        confirmVariant="destructive"
        confirmDisabled={deletingBulk}
        onConfirm={handleBulkDelete}
      />

      <ConfirmDialog
        open={bulkConfirmAlumni}
        onOpenChange={setBulkConfirmAlumni}
        title="Tandai sebagai Alumni"
        description={`${selectedIds.size} siswa akan ditandai sebagai Alumni (Lulus).`}
        confirmLabel={updatingBulk ? "Memproses..." : `Tandai ${selectedIds.size} Siswa`}
        confirmVariant="destructive"
        confirmDisabled={updatingBulk}
        onConfirm={handleBulkAlumni}
      />

      <ConfirmDialog
        open={bulkConfirmRevert}
        onOpenChange={setBulkConfirmRevert}
        title="Kembalikan ke Siswa Aktif"
        description={`${selectedIds.size} alumni akan dikembalikan menjadi Siswa Aktif.`}
        confirmLabel={updatingBulk ? "Memproses..." : `Kembalikan ${selectedIds.size} Siswa`}
        confirmVariant="default"
        confirmDisabled={updatingBulk}
        onConfirm={handleBulkRevert}
      />

      <EntityExportDialog
        scope={exporter.scope}
        onClose={exporter.close}
        entityLabel="Siswa"
        filteredHint={`Mengekspor data ${activeTab === "aktif" ? "siswa aktif" : "alumni"} sesuai pencarian aktif.`}
        isLoading={exporter.exporting}
        onExport={exporter.handleExport}
      />
    </AdminPageShell>
  );
}
