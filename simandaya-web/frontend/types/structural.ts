import { StructuralRole, UserType } from "./enums";

export interface GetStructuralRoleResponse {
  guru_id: string;
  nip: string | null;
  nama_lengkap: string;
  structural_role: StructuralRole;
  user_type: UserType;
}

export interface GetStructuralRoleResponseList {
  list_of_struct: GetStructuralRoleResponse[];
}
