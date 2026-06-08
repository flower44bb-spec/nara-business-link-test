import "../globals.css";

export default function BusinessesPage() {
  const businesses = [
    ["奈良建設株式会社", "建設業", "奈良市", "店舗改装・外構工事"],
    ["カフェ ディアー", "飲食業", "橿原市", "地元食材カフェ"],
    ["Web制作オフィスLily", "IT・Web", "生駒市", "HP制作・SNS運用"],
  ];

  return (
    <main className="panel">
 <a href="/" className="backBtn">
    ← トップページへ戻る
  </a>
      <h1>事業者検索</h1>
      <div className="filters">
        <select><option>すべての業種</option><option>建設業</option><option>飲食業</option></select>
        <select><option>すべての地域</option><option>奈良市</option><option>橿原市</option></select>
        <input placeholder="会社名・サービス名で検索" />
        <button>検索</button>
      </div>

      <div className="grid">
        {businesses.map((b) => (
          <article className="card" key={b[0]}>
            <div className="photo">{b[1]}</div>
            <span>{b[1]}</span>
            <h3>{b[0]}</h3>
            <p className="area">{b[2]}</p>
            <p>{b[3]}</p>
            <button>詳細を見る</button>
          </article>
        ))}
      </div>
    </main>
  );
}
