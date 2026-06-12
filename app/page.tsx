import {
  ArrowRight,
  Building2,
  CalendarDays,
  Handshake,
  Lightbulb,
  MessageCircle,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { HomeStats } from "@/components/home-stats";

const features = [
  {
    href: "/businesses",
    icon: Building2,
    title: "事業者を探す",
    text: "地域や業種、得意分野から、頼れる青年部の仲間を探せます。",
  },
  {
    href: "/problems",
    icon: Lightbulb,
    title: "困りごと相談",
    text: "経営や現場の悩みを共有して、知恵や技術を持つ仲間とつながります。",
  },
  {
    href: "/collaborations",
    icon: Handshake,
    title: "コラボ募集",
    text: "商品開発、イベント、販路開拓。新しい挑戦のパートナーを募集できます。",
  },
  {
    href: "/successes",
    icon: Trophy,
    title: "成功事例",
    text: "青年部のつながりから生まれた仕事や連携を、次の挑戦へつなげます。",
  },
  {
    href: "/marche",
    icon: CalendarDays,
    title: "マルシェ掲示板",
    text: "イベントやマルシェの出店案件を共有し、地域のにぎわいをつくります。",
  },
  {
    href: "/members",
    icon: Users,
    title: "青年部員を探す",
    text: "経験、得意分野、相談できることから、つながりたい仲間を探せます。",
  },
  {
    href: "/messages",
    icon: MessageCircle,
    title: "DM",
    text: "承認済みの会員同士で、仕事や連携の相談を直接進められます。",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="home-hero">
        <div className="container">
          <div className="hero-copy">
            <p className="eyebrow">Nara Federation of Youth Leagues</p>
            <h1>
              <span className="hero-title-line">奈良のつながりを、</span>
              <span className="hero-title-line accent">次の商いへ。</span>
            </h1>
            <p>
              NARA BUSINESS LINKは、奈良県商工会青年部員同士の強みと課題を結び、
              新しい仕事や協業を生み出すビジネスマッチングサイトです。
            </p>
            <div className="hero-actions">
              <Link className="button" href="/businesses">
                事業者を探す <ArrowRight size={18} />
              </Link>
              <Link className="button secondary" href="/auth">
                会員登録・ログイン
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HomeStats />

      <section className="home-section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Connect &amp; Create</p>
            <h2>つながりから、仕事を生み出す。</h2>
            <p>
              名刺交換で終わらない関係へ。課題を相談し、仲間を見つけ、
              互いの事業をより強くするための機能を揃えています。
            </p>
          </div>
          <div className="feature-grid">
            {features.map(({ href, icon: Icon, title, text }) => (
              <Link className="feature-card" href={href} key={href}>
                <span className="feature-icon"><Icon size={23} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="text-link">詳しく見る <ArrowRight size={13} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section alt">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">For Nara Business</p>
            <h2>知っている誰かが、力になれる。</h2>
            <p>
              事業の規模や業種を越えて、顔の見える関係だからこそ相談できることがあります。
              奈良で働く青年部員の経験と専門性を、地域の未来に役立てます。
            </p>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <div>
            <h2>あなたの事業を登録しませんか。</h2>
            <p>まずはプロフィールを公開して、新しい出会いの準備を。</p>
          </div>
          <Link className="button" href="/businesses/new">
            事業者情報を登録 <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
