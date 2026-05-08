"use client";

import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { useDeleteTeacherMutation } from "@/api/admin/teachers";
import type { GuruProfile } from "@/types/teachers";
import { getApiErrorMessage } from "@/lib/api-error";

interface TeacherDeleteDialogProps {
  teacher: GuruProfile | null;
  open: boolean;
  onClose: () => void;
}

export function TeacherDeleteDialog({ teacher, open, onClose }: TeacherDeleteDialogProps) {
  const [deleteTeacher, { isLoading, error, reset }] = useDeleteTeacherMutation();

  const handleDelete = async () => {
    if (!teacher) return;
    const result = await deleteTeacher(teacher.guru_id);
    if (!("error" in result)) onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const errorMessage = getApiErrorMessage(error);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
      title="Hapus Civitas Akademik"
      description={
        <>
          Apakah Anda yakin ingin menghapus{" "}
          <strong>{teacher?.nama_lengkap}</strong> (NIP: {teacher?.nip})?
          Tindakan ini tidak dapat dibatalkan. Akun login juga akan dihapus.
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
