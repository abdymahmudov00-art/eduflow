"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Spinner from "@/components/ui/spinner/Spinner";
import { homePathFor, useAuth } from "@/lib/auth/useAuth";

/** Только для гостей: вошедшего пользователя отправляет в его кабинет */
const GuestOnly = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session) router.replace(homePathFor(session.role));
  }, [session, router]);

  if (session !== null) return <Spinner fullscreen />;
  return <>{children}</>;
};

export default GuestOnly;
