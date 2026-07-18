"use client";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function SitePresence() {
  useEffect(() => {
    const key = crypto.randomUUID();
    const channel = supabase.channel("haswolf-site-visitors", { config: { presence: { key } } });
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const { data: { user } } = await supabase.auth.getUser();
        await channel.track({
          visitorId: key,
          userId: user?.id ?? null,
          anonymous: !user,
          device: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
          onlineAt: new Date().toISOString(),
        });
      }
    });
    return () => { void channel.untrack(); void supabase.removeChannel(channel); };
  }, []);
  return null;
}
