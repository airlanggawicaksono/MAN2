export type UserType = "Siswa" | "Guru" | "Admin";

export interface User {
  user_id: string;
  username: string | null;
  user_type: UserType;
  registration_status: "Pending" | "Completed";
  created_at: string;
  last_login: string | null;
  is_active: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}
