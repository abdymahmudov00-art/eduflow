import type { Metadata } from "next";
import Dashboard from "@/components/layout/dashboard/Dashboard";
import RoleGuard from "@/components/layout/role-guard/RoleGuard";
import { STUDENT_NAV, STUDENT_TABS } from "@/config/navigation";

export const metadata: Metadata = { title: "Личный кабинет" };

export default function StudentLayout({ children }: LayoutProps<"/student">) {
  return (
    <RoleGuard role="student">
      <Dashboard nav={STUDENT_NAV} tabs={STUDENT_TABS} profileHref="/student/profile">
        {children}
      </Dashboard>
    </RoleGuard>
  );
}
