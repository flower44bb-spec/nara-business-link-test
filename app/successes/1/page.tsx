import "../../globals.css";

export default function SuccessDetailPage() {
  return (
    <main className="panel">
      <p className="badge">IT・Web × 飲食業</p>
      <h1>ホームページ制作の相談から受注が成立</h1>

      <h2>概要</h2>
      <p>
        飲食店の集客課題に対し、青年部内のWeb制作事業者を紹介。
        相談からホームページ制作の受注につながった事例です。
      </p>

      <h2>マッチングの流れ</h2>
      <p>
        困りごと投稿 → 委員会で紹介先を検討 → Web制作事業者へ接続 →
        面談 → 受注成立
      </p>

      <h2>成果</h2>
      <p>
        ホームページ制作案件の受注、飲食店の集客改善、青年部内取引の創出。
      </p>

      <a className="loginBtn" href="/successes">一覧へ戻る</a>
    </main>
  );
}
