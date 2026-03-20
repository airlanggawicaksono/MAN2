import type { ReactNode } from "react";
import RoleRouteGuard from "../components/role-route-guard";

interface Props {
  readonly children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
  return <RoleRouteGuard requiredRole="Admin">{children}</RoleRouteGuard>;
}
