"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Spinner from "@/components/ui/spinner/Spinner";

/** Старый адрес: платежи теперь в разделе «Контракт» */
export default function StudentPaymentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/student/contract");
  }, [router]);
  return <Spinner />;
}
