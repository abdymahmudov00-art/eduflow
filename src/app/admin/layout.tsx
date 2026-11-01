import type { Metadata } from "next";
import Dashboard from "@/components/layout/dashboard/Dashboard";
import RoleGuard from "@/components/layout/role-guard/RoleGuard";
import { ADMIN_NAV, ADMIN_TABS } from "@/config/navigation";

export const metadata: Metadata = { title: "Администрирование" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RoleGuard role="admin">
      <Dashboard nav={ADMIN_NAV} tabs={ADMIN_TABS} profileHref="/admin/profile">
        {children}
      </Dashboard>
    </RoleGuard>
  );
}
