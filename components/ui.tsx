import { ArrowLeft, Home, LoaderCircle } from "lucide-react";
import Link from "next/link";

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-hero">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}

export function HomeLink() {
  return (
    <Link className="back-link" href="/">
      <Home size={16} /> ホームへ戻る
    </Link>
  );
}

export function BackLink({ href }: { href: string }) {
  return (
    <div className="back-links">
      <Link className="back-link" href={href}>
        <ArrowLeft size={16} /> 前のページへ戻る
      </Link>
      <Link className="back-link" href="/">
        <Home size={16} /> ホームへ戻る
      </Link>
    </div>
  );
}

export function Loading() {
  return (
    <div className="state-box">
      <LoaderCircle className="spin" />
      <p>読み込んでいます</p>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="state-box">
      <p>{text}</p>
    </div>
  );
}
