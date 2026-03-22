import type { StructuralRole } from "./enums";

export interface StructuralRoleRef {
  role_id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface GuruStructuralAssignment {
  assignment_id: string;
  user_id: string;
  role_id: string;
  structural_role: StructuralRole | null;
  role_code: string | null;
  role_name: string | null;
  tahun_ajaran_id: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export interface AssignStructuralRoleRequest {
  user_id: string;
  structural_role: StructuralRole;
  kelas_id?: string | null;
  tahun_ajaran_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}
