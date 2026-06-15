import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Analytics is not configured." }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.nextUrl.host) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  let input: {
    path?: string;
    visitorId?: string;
    sessionId?: string;
    referrerHost?: string | null;
    deviceType?: string;
  };
  try {
    input = (await request.json()) as typeof input;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (
    !input.path ||
    !input.visitorId ||
    !input.sessionId ||
    input.path.startsWith("/admin")
  ) {
    return NextResponse.json({ error: "Invalid analytics data." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.rpc("record_page_view", {
    page_path: input.path,
    anonymous_visitor_id: input.visitorId,
    browser_session_id: input.sessionId,
    source_host: input.referrerHost || null,
    client_device_type: input.deviceType || "desktop",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
