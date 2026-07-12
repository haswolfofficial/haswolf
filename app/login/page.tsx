"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/");
      }
    });
  }, [router]);

  async function handleEmailLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#1a1a1a",
          padding: 30,
          borderRadius: 12,
          color: "white",
        }}
      >
        <h1 style={{ marginBottom: 20 }}>Haswolf Giriş</h1>

        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 15,
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={{
            width: "100%",
            padding: 12,
            boxSizing: "border-box",
          }}
        />

        <button
          type="button"
          onClick={handleEmailLogin}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 20,
            padding: 14,
            cursor: loading ? "not-allowed" : "pointer",
            background: "#dca914",
            color: "#000",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold",
          }}
        >
          {loading ? "Bekleyin..." : "Giriş Yap"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "22px 0",
          }}
        >
          <div style={{ height: 1, flex: 1, background: "#444" }} />
          <span style={{ color: "#999" }}>veya</span>
          <div style={{ height: 1, flex: 1, background: "#444" }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            background: "#fff",
            color: "#111",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Google ile Giriş Yap
        </button>

        {message && (
          <p
            style={{
              marginTop: 18,
              color: "#ff7272",
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        )}
      </section>
    </main>
  );
}