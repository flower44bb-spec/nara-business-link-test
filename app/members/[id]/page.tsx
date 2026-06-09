"use client";

import { Pencil, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { MessageUserButton } from "@/components/message-user-button";
import { BackLink, Empty, Loading, PageHero } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [member, setMember] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("public_profiles").select("*").eq("id", id).single().then(({ data }) => {
      setMember(data as Profile | null);
      setLoading(false);
    });
  }, [id]);

  return (
    <main>
      <PageHero eyebrow="Member Profile" title="青年部員プロフィール" description="得意分野や相談できることを知り、地域の仲間とつながりましょう。" />
      <section className="page-content">
        <div className="container">
          <BackLink href="/members" />
          {loading ? <Loading /> : !member ? <Empty text="プロフィールが見つかりません。" /> : (
            <div className="detail-layout">
              <article className="detail-card profile-detail">
                <div className="profile-heading">
                  <div className="avatar large">
                    {member.avatar_url ? <img src={member.avatar_url} alt="" /> : <UserRound size={55} />}
                  </div>
                  <div>
                    <span className="tag">{member.local_chapter || "所属単会未設定"}</span>
                    <h1>{member.full_name || "氏名未設定"}</h1>
                    <p>{member.position || "役職未設定"}</p>
                  </div>
                </div>
                <dl className="detail-list">
                  <div className="detail-row"><dt>会社名</dt><dd>{member.company_name || "未設定"}</dd></div>
                  <div className="detail-row"><dt>業種</dt><dd>{member.industry || "未設定"}</dd></div>
                  <div className="detail-row"><dt>自己紹介</dt><dd>{member.bio || "未設定"}</dd></div>
                  <div className="detail-row"><dt>相談できること</dt><dd>{member.can_help_with || "未設定"}</dd></div>
                  <div className="detail-row"><dt>つながりたい業種</dt><dd>{member.wants_to_connect_with || "未設定"}</dd></div>
                </dl>
              </article>
              <aside className="side-card">
                <h3>この会員とつながる</h3>
                <p className="summary">仕事や連携について、サイト内DMで直接相談できます。</p>
                <MessageUserButton recipientId={member.id} />
                {user?.id === member.id && (
                  <Link className="button secondary" href="/members/me/edit"><Pencil size={16} /> プロフィール編集</Link>
                )}
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
