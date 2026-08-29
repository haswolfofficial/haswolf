"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <main className="haswolf-legal-shell flex min-h-screen items-center justify-center px-4 py-12 text-white">
      <p className="text-sm text-zinc-400">Vitrine yönlendiriliyorsun...</p>
    </main>
  );
}
