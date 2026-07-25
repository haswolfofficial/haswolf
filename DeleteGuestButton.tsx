"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DeleteGuestButton({
  userId,
  nickname,
  onDeleted,
}: {
  userId: string;
  nickname: string;
  onDeleted?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function deleteGuest() {
    if (
      !window.confirm(
        `${nickname} adlı misafir oturumu tamamen silinsin mi? Kullanıcı daha sonra yeniden misafir olarak katılabilir.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Yönetici oturumu bulunamadı.");
      }

      const response = await fetch("/api/admin/delete-guest", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Misafir silinemedi.");
      }

      onDeleted?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Misafir silinemedi.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="haswolf-delete-guest">
      <button
        type="button"
        disabled={busy}
        onClick={() => void deleteGuest()}
      >
        {busy ? "Siliniyor..." : "Misafir oturumunu sil"}
      </button>
      {error && <small>{error}</small>}
    </div>
  );
}
