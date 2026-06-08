"use client";

import { useMemo, useState } from "react";
import "./globals.css";

const businesses = [
  { name: "奈良建設株式会社", category: "建設業", area: "奈良市", desc: "店舗改装・外構工事・リフォーム対応", need: "店舗を持つ事業者との連携" },
  { name: "カフェ ディアー", category: "飲食業", area: "橿原市", desc: "地元食材を活用したカフェ・ケータリング", need: "農家・デザイナーとの連携" },
  { name: "Web制作オフィスLily", category: "IT・Web", area: "生駒市", desc: "ホームページ制作・SNS運用支援", need: "飲食店・小売業との連携" },
  { name: "やまと農園", category: "農業", area: "天理市", desc: "野菜の生産・販売・飲食店向け卸", need: "飲食店・マルシェ出店先" },
  { name: "山本自動車整備工場", category: "自動車整備", area: "大和高田市", desc: "車検・整備・鈑金塗装", need: "法人車両を持つ事業者" },
  { name: "中村会計事務所", category: "士業・会計", area: "奈良市", desc: "税務・会計・補助金相談", need: "創業者・若手経営者" },
];

const posts = [
  { type: "困りごと", title: "Instagram運用を相談したい", from: "飲食業", area: "橿原市", detail: "新商品PRと店舗集客を強化したい。" },
  { type: "コラボ募集", title: "マルシェ共同出店メンバー募集", from: "農業", area: "天理市", detail: "食品・雑貨・体験系の事業者を募集。" },
  { type: "青年部限定案件", title: "店舗改装に伴う内装業者を探しています", from: "小売業", area: "葛城市", detail: "7月頃に店舗改装を予定。" },
];

const successes = [
  { tag: "IT・Web × 飲食業", title: "ホームページ制作の相談から受注が成立", result: "HP制作受注" },
  { tag: "農業 × 飲食業", title: "地元野菜の仕入れ連携が成立", result: "継続取引見込み" },
  { tag: "建設業 × 小売業", title: "店舗改装の相談から見積依頼へ", result: "商談成立" },
];

export default function Home() {
  const [category, setCategory] = useState("すべて");
  const [area, setArea] = useState("すべて");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(businesses[0]);

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const c = category === "すべて" || b.category === category;
      const a = area === "すべて" || b.area === area;
      const k =
        keyword === "" ||
        b.name.includes(keyword) ||
        b.category.includes(keyword) ||
        b.area.includes(keyword) ||
        b.desc.includes(keyword) ||
        b.need.includes(keyword);
      return c && a && k;
    });
  }, [category, area, keyword]);

  return (
    <main>
      <header className="header">
        <div className="logo">🦌 NARA BUSINESS LINK</div>
        <nav>
          <a href="#top">ホーム</a>
          <a href="#search">事業者検索</a>
          <a href="#posts">困りごと相談</a>
          <a href="#collab">コラボ募集</a>
          <a href="#success">成功事例</a>
        </nav>
        <a className="loginBtn" href="#login">ログイン</a>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="label">奈良県商工会青年部員限定</p>
          <h1>NARA<br />BUSINESS LINK</h1>
          <p className="lead">「交流」で終わらせず、青年部員同士で仕事が生まれる仕組みをつくる。</p>
          <div className="heroBtns">
            <a href="#search">事業者を探す</a>
            <a className="outline" href="#posts">案件を見る</a>
          </div>
        </div>
        <div className="map">NARA<br />NETWORK</div>
      </section>

      <section className="menu">
        <a href="#search">🔍<h3>事業者を探す</h3><p>業種・地域から検索</p></a>
        <a href="#posts">💡<h3>困りごと相談</h3><p>課題を投稿・相談</p></a>
        <a href="#collab">🤝<h3>コラボ募集</h3><p>協業相手を探す</p></a>
        <a href="#success">🏆<h3>成功事例</h3><p>実績を共有</p></a>
      </section>

      <section className="panel" id="search">
        <h2>事業者検索</h2>
        <div className="filters">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>すべて</option><option>建設業</option><option>飲食業</option><option>IT・Web</option><option>農業</option><option>自動車整備</option><option>士業・会計</option>
          </select>
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            <option>すべて</option><option>奈良市</option><option>橿原市</option><option>葛城市</option><option>生駒市</option><option>天理市</option><option>大和高田市</option>
          </select>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="会社名・サービス・強みなど" />
          <button>検索</button>
        </div>
        <p className="count">検索結果：{filtered.length}件</p>
        <div className="grid">
          {filtered.map((b) => (
            <article className="card" key={b.name}>
              <div className="photo">{b.category}</div>
              <span>{b.category}</span>
              <h3>{b.name}</h3>
              <p className="area">{b.area}</p>
              <p>{b.desc}</p>
              <button onClick={() => setSelected(b)}>詳細を見る</button>
            </article>
          ))}
        </div>
      </section>

      <section className="two">
        <div className="panel">
          <h2>事業者詳細</h2>
          <p className="badge">{selected.category}</p>
          <h3>{selected.name}</h3>
          <p><strong>地域：</strong>{selected.area}</p>
          <p><strong>事業内容：</strong>{selected.desc}</p>
          <p><strong>求める連携：</strong>{selected.need}</p>
          <button>問い合わせる</button>
        </div>

        <div className="panel" id="login">
          <h2>ログイン</h2>
          <input placeholder="メールアドレス" />
          <input placeholder="パスワード" type="password" />
          <button>ログインする</button>
          <p className="note">※デモ画面です。実運用時はSupabaseで認証管理します。</p>
        </div>
      </section>

      <section className="two" id="posts">
        <div className="panel">
          <h2>困りごと投稿</h2>
          <input placeholder="タイトル" />
          <select><option>集客</option><option>採用</option><option>補助金</option><option>資金繰り</option><option>その他</option></select>
          <textarea placeholder="相談内容を入力してください"></textarea>
          <button>投稿する</button>
        </div>

        <div className="panel" id="collab">
          <h2>コラボ募集投稿</h2>
          <input placeholder="募集タイトル" />
          <input placeholder="募集したい業種" />
          <textarea placeholder="協業内容を入力してください"></textarea>
          <button>募集を投稿する</button>
        </div>
      </section>

      <section className="two">
        <div className="panel">
          <h2>新着案件</h2>
          {posts.map((p) => (
            <article className="post" key={p.title}>
              <span>{p.type}</span>
              <h3>{p.title}</h3>
              <p>{p.from} ／ {p.area}</p>
              <p>{p.detail}</p>
            </article>
          ))}
        </div>

        <div className="panel" id="success">
          <h2>成功事例</h2>
          {successes.map((s) => (
            <article className="post" key={s.title}>
              <span>{s.tag}</span>
              <h3>{s.title}</h3>
              <p><strong>成果：</strong>{s.result}</p>
            </article>
          ))}
        </div>
      </section>

      <footer>奈良県商工会青年部連合会　ビジネスリンク部会</footer>
    </main>
  );
}
