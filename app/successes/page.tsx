import "../globals.css";

export default function SuccessesPage() {
  return (
    <main className="panel">
      <h1>成功事例一覧</h1>

      <div className="grid">
        <article className="card">
          <div className="photo">IT・Web × 飲食業</div>
          <span>成功事例</span>
          <h3>ホームページ制作の相談から受注が成立</h3>
          <p>青年部内の紹介により、飲食店とWeb制作事業者がマッチング。</p>
          <a className="loginBtn" href="/successes/1">詳細を見る</a>
        </article>

        <article className="card">
          <div className="photo">農業 × 飲食業</div>
          <span>成功事例</span>
          <h3>地元野菜の仕入れ連携が成立</h3>
          <p>販路拡大を希望する農家と飲食店が連携。</p>
          <a className="loginBtn" href="/successes/1">詳細を見る</a>
        </article>
      </div>
    </main>
  );
}
