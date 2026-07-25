import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/server-supabase";
import { hasAdminAccess } from "@/lib/admin-access";

export async function DELETE(request: NextRequest) {
  try {
    const accessToken = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Yönetici oturumu gerekli." },
        { status: 401 },
      );
    }

    const supabase = createServiceClient();
    const { data: authData, error: authError } =
      await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Geçersiz yönetici oturumu." },
        { status: 401 },
      );
    }

    if (!(await hasAdminAccess(authData.user))) {
      return NextResponse.json(
        { error: "Bu işlem için yönetici yetkisi gerekli." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      userId?: string;
    };

    if (!body.userId) {
      return NextResponse.json(
        { error: "Silinecek misafir kimliği eksik." },
        { status: 400 },
      );
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id,is_guest,nickname")
        .eq("id", body.userId)
        .maybeSingle();

    if (profileError) throw profileError;

    if (!profile?.is_guest) {
      return NextResponse.json(
        { error: "Yalnızca misafir hesapları bu işlemle silinebilir." },
        { status: 400 },
      );
    }

    await supabase
      .from("community_presence")
      .delete()
      .eq("user_id", body.userId);

    await supabase
      .from("community_members")
      .delete()
      .eq("user_id", body.userId);

    await supabase
      .from("profiles")
      .delete()
      .eq("id", body.userId);

    const { error: deleteAuthError } =
      await supabase.auth.admin.deleteUser(body.userId);

    if (deleteAuthError) throw deleteAuthError;

    return NextResponse.json({
      ok: true,
      message:
        "Misafir oturumu silindi. Aynı kişi daha sonra yeniden misafir olarak katılabilir.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Misafir hesabı silinemedi.",
      },
      { status: 500 },
    );
  }
}
