import type { ReactNode } from "react";
import RoleRouteGuard from "../components/role-route-guard";

interface Props {
  readonly children: ReactNode;
}

export default function SiswaLayout({ children }: Props) {
  return <RoleRouteGuard requiredRole="Siswa">{children}</RoleRouteGuard>;
}
