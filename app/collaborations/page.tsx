import "../globals.css";

export default function CollaborationsPage() {
  const items = [
    ["マルシェ共同出店メンバー募集", "農業", "天理市"],
    ["奈良県産品の共同商品開発", "食品製造", "橿原市"],
    ["イベント運営協力者募集", "サービス業", "奈良市"],
  ];

  return (
    <main className="two">
      <section className="panel">
 <a href="/" className="backBtn">
    ← トップページへ戻る
  </a>
        <h1>コラボ募集投稿</h1>
        <input placeholder="募集タイトル" />
        <input placeholder="募集したい業種" />
        <textarea placeholder="協業内容を入力してください"></textarea>
        <button>募集を投稿する</button>
      </section>

      <section className="panel">
        <h1>コラボ募集一覧</h1>
        {items.map((i) => (
          <article className="post" key={i[0]}>
            <span>コラボ募集</span>
            <h3>{i[0]}</h3>
            <p>{i[1]} ／ {i[2]}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
