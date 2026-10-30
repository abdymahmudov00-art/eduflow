"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Spinner from "@/components/ui/spinner/Spinner";
import type { UserRole } from "@/lib/api/types";
import { homePathFor, useAuth } from "@/lib/auth/useAuth";

interface RoleGuardProps {
  role: UserRole;
  children: ReactNode;
}

/** Пускает только пользователя с нужной ролью, остальных перенаправляет */
const RoleGuard = ({ role, children }: RoleGuardProps) => {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.replace("/login");
    else if (session && session.role !== role) router.replace(homePathFor(session.role));
  }, [session, role, router]);

  if (!session || session.role !== role) return <Spinner fullscreen label="Проверка доступа…" />;
  return <>{children}</>;
};

export default RoleGuard;
