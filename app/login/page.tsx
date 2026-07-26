import { Suspense } from "react";
import LoginClient from "./LoginClient";

function LoginLoading() {
  return (
    <main className="haswolf-legal-shell flex min-h-screen items-center justify-center px-4 py-12">
      <section className="haswolf-legal-card w-full max-w-md p-7 sm:p-9">
        <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-9 w-44 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-14 animate-pulse rounded bg-white/10" />
        <div className="mt-7 h-14 animate-pulse rounded-xl bg-white/10" />
        <div className="my-5 h-px bg-white/10" />
        <div className="h-14 animate-pulse rounded-xl bg-white/10" />
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginClient />
    </Suspense>
  );
}
