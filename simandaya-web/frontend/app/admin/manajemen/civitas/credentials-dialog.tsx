"use client";
import { AdminCredentialsDialog } from "@/app/components/admin/credentials-dialog";

interface CredentialsDialogProps {
  open: boolean;
  onClose: () => void;
  username: string;
  password: string;
}

export function CredentialsDialog({
  open,
  onClose,
  username,
  password,
}: CredentialsDialogProps) {
  return <AdminCredentialsDialog open={open} onClose={onClose} username={username} password={password} />;
}
