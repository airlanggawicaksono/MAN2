"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteTeacherMutation } from "@/api/admin/teachers";
import type { GuruProfile } from "@/types/teachers";

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

  const errorMessage =
    error && "data" in error
      ? (() => { const d = (error.data as { detail?: unknown })?.detail; return typeof d === "string" ? d : Array.isArray(d) ? d.map((e: any) => e.msg).join(", ") : undefined; })()
      : undefined;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Civitas Akademik</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus{" "}
            <strong>{teacher?.nama_lengkap}</strong> (NIP: {teacher?.nip})?
            Tindakan ini tidak dapat dibatalkan. Akun login juga akan dihapus.
          </DialogDescription>
        </DialogHeader>
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
