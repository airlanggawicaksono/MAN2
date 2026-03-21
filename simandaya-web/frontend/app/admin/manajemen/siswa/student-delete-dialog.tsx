"use client";

import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { useDeleteStudentMutation } from "@/api/admin/students";
import type { StudentProfile } from "@/types/students";

interface StudentDeleteDialogProps {
  student: StudentProfile | null;
  open: boolean;
  onClose: () => void;
}

export function StudentDeleteDialog({ student, open, onClose }: StudentDeleteDialogProps) {
  const [deleteStudent, { isLoading, error, reset }] = useDeleteStudentMutation();

  const handleDelete = async () => {
    if (!student) return;
    const result = await deleteStudent(student.siswa_id);
    if ("data" in result) onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const errorMessage =
    error && "data" in error
      ? (() => { const d = (error.data as { detail?: unknown })?.detail; return typeof d === "string" ? d : Array.isArray(d) ? d.map((e: any) => e.msg).join(", ") : undefined; })()
      : undefined;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
      title="Hapus Siswa"
      description={
        <>
          Apakah Anda yakin ingin menghapus siswa{" "}
          <strong>{student?.nama_lengkap}</strong> (NIS: {student?.nis})?
          Tindakan ini tidak dapat dibatalkan. Akun login siswa juga akan dihapus.
        </>
      }
      confirmLabel={isLoading ? "Menghapus..." : "Hapus"}
      confirmVariant="destructive"
      confirmDisabled={isLoading}
      onConfirm={handleDelete}
    >
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </ConfirmDialog>
  );
}
