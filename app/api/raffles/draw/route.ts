import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/server-supabase";

const ADMIN_EMAIL = "haswolf666@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

    const supabase = createServiceClient();
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Geçersiz oturum." }, { status: 401 });

    const { raffleId } = await request.json();
    const { data: delegated } = await supabase.from("raffle_managers").select("user_id").eq("user_id", user.id).maybeSingle();
    if (user.email !== ADMIN_EMAIL && !delegated) return NextResponse.json({ error: "Çekiliş yapma yetkin yok." }, { status: 403 });

    const { data: raffle } = await supabase.from("raffles").select("id,status,winner_count").eq("id", raffleId).single();
    if (!raffle || raffle.status !== "active") return NextResponse.json({ error: "Aktif çekiliş bulunamadı." }, { status: 400 });

    const { data: entries, error } = await supabase.from("raffle_entries").select("id,user_id,display_name").eq("raffle_id", raffleId).eq("is_valid", true);
    if (error) throw error;
    if (!entries || entries.length < raffle.winner_count) return NextResponse.json({ error: "Yeterli geçerli katılımcı yok." }, { status: 400 });

    const pool = [...entries];
    const winners = [];
    while (winners.length < raffle.winner_count && pool.length) winners.push(pool.splice(randomInt(pool.length), 1)[0]);

    await supabase.from("raffle_winners").delete().eq("raffle_id", raffleId);
    const { error: insertError } = await supabase.from("raffle_winners").insert(winners.map((winner, index) => ({
      raffle_id: raffleId,
      entry_id: winner.id,
      user_id: winner.user_id,
      display_name: winner.display_name,
      position: index + 1,
      drawn_by: user.id,
    })));
    if (insertError) throw insertError;

    await supabase.from("raffles").update({ status: "completed", drawn_at: new Date().toISOString(), drawn_by: user.id }).eq("id", raffleId);
    return NextResponse.json({ winners });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Çekiliş tamamlanamadı." }, { status: 500 });
  }
}
