import type { ReactNode } from "react";
import RoleRouteGuard from "../components/role-route-guard";

interface Props {
  readonly children: ReactNode;
}

export default function GuruLayout({ children }: Props) {
  return <RoleRouteGuard requiredRole="Guru">{children}</RoleRouteGuard>;
}
