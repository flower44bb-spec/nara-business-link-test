import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { recordTitle } from "@/lib/records";
import type { BaseRecord, Profile } from "@/types";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!accessToken || !supabaseUrl || !supabaseAnonKey) {
    return errorResponse("認証情報を確認できません。", 401);
  }

  const instagramAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const graphVersion = process.env.META_GRAPH_API_VERSION || "v23.0";
  if (!instagramAccountId || !instagramAccessToken) {
    return errorResponse(
      "Instagram連携が未設定です。Vercelの環境変数を設定してください。",
      503,
    );
  }

  let input: { businessId?: string; caption?: string };
  try {
    input = (await request.json()) as typeof input;
  } catch {
    return errorResponse("送信内容を確認できません。", 400);
  }

  const businessId = String(input.businessId || "");
  const caption = String(input.caption || "").trim();
  if (!businessId || !caption || caption.length > 2200) {
    return errorResponse("事業者情報と2,200文字以内の投稿文を入力してください。", 400);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return errorResponse("ログインの有効期限が切れています。再ログインしてください。", 401);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if ((profile as Pick<Profile, "role"> | null)?.role !== "admin") {
    return errorResponse("Instagram投稿は管理者のみ実行できます。", 403);
  }

  const { data: businessData, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();
  const business = businessData as BaseRecord | null;
  if (businessError || !business) {
    return errorResponse("事業者情報を取得できませんでした。", 404);
  }
  if (business.approval_status !== "approved") {
    return errorResponse("承認済みの事業者のみInstagramへ投稿できます。", 400);
  }

  const imageUrl = String(business.image_url || "");
  if (!isPublicHttpsUrl(imageUrl)) {
    return errorResponse("Instagram投稿には公開されたHTTPS画像が必要です。", 400);
  }

  try {
    const container = await graphRequest<{ id: string }>(
      `${graphVersion}/${instagramAccountId}/media`,
      {
        image_url: imageUrl,
        caption,
        access_token: instagramAccessToken,
      },
    );
    const published = await graphRequest<{ id: string }>(
      `${graphVersion}/${instagramAccountId}/media_publish`,
      {
        creation_id: container.id,
        access_token: instagramAccessToken,
      },
    );
    const media = await graphGet<{ permalink?: string }>(
      `${graphVersion}/${published.id}`,
      {
        fields: "permalink",
        access_token: instagramAccessToken,
      },
    );

    await supabase.from("instagram_publish_logs").insert({
      business_id: businessId,
      published_by: userData.user.id,
      instagram_media_id: published.id,
      caption,
      image_url: imageUrl,
      permalink: media.permalink || null,
      status: "published",
      error_message: null,
    });

    return NextResponse.json({
      mediaId: published.id,
      permalink: media.permalink || null,
      message: `「${recordTitle(business)}」をInstagramへ投稿しました。`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Instagram APIでエラーが発生しました。";
    await supabase.from("instagram_publish_logs").insert({
      business_id: businessId,
      published_by: userData.user.id,
      caption,
      image_url: imageUrl,
      status: "failed",
      error_message: message,
    });
    return errorResponse(message, 502);
  }
}

async function graphRequest<T>(path: string, values: Record<string, string>) {
  const response = await fetch(`https://graph.facebook.com/${path}`, {
    method: "POST",
    body: new URLSearchParams(values),
    cache: "no-store",
  });
  return parseGraphResponse<T>(response);
}

async function graphGet<T>(path: string, values: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${path}`);
  Object.entries(values).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { cache: "no-store" });
  return parseGraphResponse<T>(response);
}

async function parseGraphResponse<T>(response: Response) {
  const result = (await response.json()) as {
    error?: { message?: string; error_user_msg?: string };
  } & T;
  if (!response.ok || result.error) {
    throw new Error(
      result.error?.error_user_msg ||
        result.error?.message ||
        "Instagram APIへの送信に失敗しました。",
    );
  }
  return result;
}

function isPublicHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}
