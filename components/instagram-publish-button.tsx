"use client";

import { Camera, ExternalLink, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { recordDescription, recordTitle } from "@/lib/records";
import type { BaseRecord } from "@/types";

export function InstagramPublishButton({ business }: { business: BaseRecord }) {
  const { session, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState(() => createCaption(business));
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [permalink, setPermalink] = useState("");

  if (!isAdmin) return null;

  const canPublish =
    business.approval_status === "approved" && Boolean(business.image_url);

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!session?.access_token) {
      setError("ログイン情報を確認できません。再ログインしてください。");
      return;
    }

    setPublishing(true);
    setError("");
    setPermalink("");

    try {
      const response = await fetch("/api/instagram/publish-business", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: String(business.id),
          caption,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        permalink?: string;
      };

      if (!response.ok) {
        setError(result.error || "Instagramへ投稿できませんでした。");
        return;
      }

      setPermalink(result.permalink || "https://www.instagram.com/narakenseiren/");
    } catch {
      setError("Instagram投稿APIへ接続できませんでした。時間をおいて再度お試しください。");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="instagram-publish">
      <button
        className="button instagram-admin-button"
        disabled={!canPublish}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Camera size={16} />
        Instagramへ投稿
      </button>
      {!canPublish && (
        <p className="inline-error">
          承認済みで画像が登録された事業者のみ投稿できます。
        </p>
      )}
      {open && canPublish && (
        <form className="instagram-publish-form" onSubmit={publish}>
          <label htmlFor="instagram-caption">投稿文</label>
          <textarea
            id="instagram-caption"
            maxLength={2200}
            onChange={(event) => setCaption(event.target.value)}
            required
            value={caption}
          />
          <span>{caption.length.toLocaleString("ja-JP")} / 2,200文字</span>
          {error && <p className="error">{error}</p>}
          {permalink && (
            <p className="notice">
              Instagramへ投稿しました。
              <a href={permalink} rel="noopener noreferrer" target="_blank">
                投稿を見る <ExternalLink size={13} />
              </a>
            </p>
          )}
          <button className="button" disabled={publishing} type="submit">
            <Send size={15} />
            {publishing ? "投稿中..." : "内容を確認して投稿"}
          </button>
        </form>
      )}
    </div>
  );
}

function createCaption(business: BaseRecord) {
  const lines = [
    `【事業者紹介】${recordTitle(business)}`,
    "",
    recordDescription(business),
    "",
    business.services ? `商品・サービス：${String(business.services)}` : "",
    business.collaboration_needs
      ? `求める連携：${String(business.collaboration_needs)}`
      : "",
    business.category ? `業種：${String(business.category)}` : "",
    business.area ? `地域：${String(business.area)}` : "",
    "",
    "#奈良県商工会青年部 #奈良県青連 #奈良ビジネス",
  ];
  return lines.filter((line, index) => line || lines[index - 1] !== "").join("\n");
}
