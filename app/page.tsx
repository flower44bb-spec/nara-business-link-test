"use client";

import { useState } from "react";
import "./globals.css";

const businesses = [
  { name: "奈良建設株式会社", category: "建設業", area: "奈良市", desc: "店舗改装・外構工事・リフォーム対応" },
  { name: "カフェ ディアー", category: "飲食業", area: "橿原市", desc: "地元食材を活用したカフェ・ケータリング" },
  { name: "Web制作オフィスLily", category: "IT・Web", area: "生駒市", desc: "ホームページ制作・SNS運用支援" },
  { name: "やまと農園", category: "農業", area: "天理市", desc: "野菜の生産・販売・飲食店向け卸" },
  { name: "山本自動車整備工場", category: "自動車整備", area: "大和高田市", desc: "車検・整備・鈑金塗装" },
  { name: "中村会計事務所", category: "士業・会計", area: "奈良市", desc: "税務・会計・補助金相談" },
];

const posts = [
  { type: "困りごと", title: "Instagram運用を相談したい", from: "飲食店", area: "橿原市" },
  { type: "コラボ募集", title: "マルシェ共同出店メンバー募集", from: "農業", area: "天理市" },
  { type: "青年部限定案件", title: "店舗改装に伴う内装業者を探しています", from: "小売業", area: "葛城市" },
];

export default function Home() {
  const [category, setCategory] = useState("すべて");
  const [area, setArea] = useState("すべて");
  const [keyword, setKeyword] = useState("");

  const filteredBusinesses = businesses.filter((b) => {
    const matchCategory = category === "すべて" || b.category === category;
    const matchArea = area === "すべて" || b.area === area;
    const matchKeyword =
      keyword === "" ||
      b.name.includes(keyword) ||
      b.category.includes(keyword) ||
      b.area.includes(keyword) ||
      b.desc.includes(keyword);

    return matchCategory && matchArea && matchKeyword;
  });

  return (
    <main>
      <header className="header">
        <div className="logo">🦌 NARA BUSINESS LINK</div>
        <nav>
          <a href="#top">ホーム</a>
          <a href="#search">事業者検索</a>
          <a href="#posts">困りごと相談</a>
          <a href="#posts">コラボ募集</a>
          <a href="#success">成功事例</a>
        </nav>
        <button>ログイン</button>
      </header>

      <section className="hero" id="top">
        <div className="heroText">
          <p className="label">奈良県商工会青年部員限定</p>
          <h1>NARA<br />BUSINESS LINK</h1>
          <p className="lead">
            「交流」で終わらせず、青年部員同士で仕事が生まれる仕組みをつくる。
          </p>
          <div className="heroButtons">
            <button onClick={() => document.getElementById("search")?.scrollIntoView({ behavior: "smooth" })}>
              事業者を探す
            </button>
            <button className="white" onClick={() => document.getElementById("posts")?.scrollIntoView({ behavior: "smooth" })}>
              案件を見る
            </button>
          </div>
        </div>

        <div className="mapBox">
          <div className="map">NARA<br />NETWORK</div>
        </div>
      </section>

      <section className="menu">
        <div>🔍<h3>事業者を探す</h3><p>業種・地域から検索</p></div>
        <div>💡<h3>困りごと相談</h3><p>課題を投稿・相談</p></div>
        <div>🤝<h3>コラボ募集</h3><p>協業相手を探す</p></div>
        <div>🏆<h3>成功事例</h3><p>マッチング実績を共有</p></div>
      </section>

      <section className="search" id="search">
        <h2>事業者検索</h2>

        <div className="filters">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>すべて</option>
            <option>建設業</option>
            <option>飲食業</option>
            <option>IT・Web</option>
            <option>農業</option>
            <option>自動車整備</option>
            <option>士業・会計</option>
          </select>

          <select value={area} onChange={(e) => setArea(e.target.value)}>
            <option>すべて</option>
            <option>奈良市</option>
            <option>橿原市</option>
            <option>葛城市</option>
            <option>生駒市</option>
            <option>天理市</option>
            <option>大和高田市</option>
          </select>

          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="会社名・サービス・強みなど"
          />

          <button type="button">検索</button>
        </div>

        <p>検索結果：{filteredBusinesses.length}件</p>

        <div className="grid">
          {filteredBusinesses.map((b) => (
            <article className="card" key={b.name}>
              <div className="photo">{b.category}</div>
              <span>{b.category}</span>
              <h3>{b.name}</h3>
              <p className="area">{b.area}</p>
              <p>{b.desc}</p>
              <button className="detail" type="button">詳細を見る</button>
            </article>
          ))}
        </div>
      </section>

      <section className="posts" id="posts">
        <div>
          <h2>新着投稿</h2>
          {posts.map((p) => (
            <div className="post" key={p.title}>
              <span>{p.type}</span>
              <h3>{p.title}</h3>
              <p>{p.from} ／ {p.area}</p>
            </div>
          ))}
        </div>

        <div className="success" id="success">
          <h2>成功事例</h2>
          <p className="badge">IT・Web × 飲食業</p>
          <h3>ホームページ制作の相談から受注が成立</h3>
          <p>
            飲食店の集客課題に対し、青年部内のWeb制作事業者とマッチング。
            新しいホームページ制作につながりました。
          </p>
        </div>
      </section>

      <footer>
        奈良県商工会青年部連合会 ビジネスリンク部会
      </footer>
    </main>
  );
}
