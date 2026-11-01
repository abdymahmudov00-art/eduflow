import type { IconName } from "@/components/ui/icon/Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Главная", icon: "home" },
  { href: "/admin/payments", label: "Платежи", icon: "wallet" },
  { href: "/admin/contracts", label: "Контракты", icon: "file" },
  { href: "/admin/groups", label: "Группы", icon: "layers" },
  { href: "/admin/students", label: "Студенты", icon: "users" },
  { href: "/admin/users", label: "Пользователи", icon: "shield" },
];

export const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "Главная", icon: "home" },
  { href: "/student/personal", label: "Личная информация", icon: "idcard" },
  { href: "/student/contract", label: "Контракт", icon: "wallet" },
  { href: "/student/schedule", label: "Расписание", icon: "calendar" },
  { href: "/student/study", label: "Учебный процесс", icon: "book" },
];

/** Нижняя панель на телефоне: самые нужные разделы, остальное — в «Ещё» */
export const STUDENT_TABS: NavItem[] = [
  { href: "/student", label: "Главная", icon: "home" },
  { href: "/student/schedule", label: "Расписание", icon: "calendar" },
  { href: "/student/study", label: "Учёба", icon: "book" },
];

export const ADMIN_TABS: NavItem[] = [
  { href: "/admin", label: "Главная", icon: "home" },
  { href: "/admin/payments", label: "Платежи", icon: "wallet" },
  { href: "/admin/students", label: "Студенты", icon: "users" },
];

/** Активный пункт — самый длинный подходящий путь («/admin» не горит на «/admin/users») */
export function findActiveItem(items: NavItem[], pathname: string): NavItem | undefined {
  return items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
