import type { Metadata } from "next";
import Dashboard from "@/components/layout/dashboard/Dashboard";
import RoleGuard from "@/components/layout/role-guard/RoleGuard";
import { STUDENT_NAV } from "@/config/navigation";

export const metadata: Metadata = { title: "Личный кабинет" };

export default function StudentLayout({ children }: LayoutProps<"/student">) {
  return (
    <RoleGuard role="student">
      <Dashboard nav={STUDENT_NAV} profileHref="/student/profile">
        {children}
      </Dashboard>
    </RoleGuard>
  );
}
