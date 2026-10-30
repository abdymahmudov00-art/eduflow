"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Spinner from "@/components/ui/spinner/Spinner";
import { homePathFor, useAuth } from "@/lib/auth/useAuth";

export default function HomePage() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.replace("/login");
    else if (session) router.replace(homePathFor(session.role));
  }, [session, router]);

  return <Spinner fullscreen />;
}
