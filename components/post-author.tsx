import { Building2, MapPin, UserRound } from "lucide-react";
import type { PostAuthor as PostAuthorType } from "@/types";

export function PostAuthor({
  author,
  compact = false,
}: {
  author?: PostAuthorType;
  compact?: boolean;
}) {
  const chapter = author?.local_chapter || "所属単会未設定";
  const company = author?.company_name || "会社名未設定";
  const name = author?.full_name || "氏名未設定";

  if (compact) {
    return (
      <div className="post-author compact" aria-label="投稿者情報">
        <span><MapPin size={13} /> {chapter}</span>
        <span><Building2 size={13} /> {company}</span>
        <span><UserRound size={13} /> {name}</span>
      </div>
    );
  }

  return (
    <dl className="detail-list post-author-detail">
      <div className="detail-row"><dt>所属単会</dt><dd>{chapter}</dd></div>
      <div className="detail-row"><dt>会社名</dt><dd>{company}</dd></div>
      <div className="detail-row"><dt>氏名</dt><dd>{name}</dd></div>
    </dl>
  );
}
