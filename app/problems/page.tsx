import "../globals.css";

export default function ProblemsPage() {
  const problems = [
    ["Instagram運用を相談したい", "飲食業", "橿原市"],
    ["採用に困っている", "建設業", "奈良市"],
    ["補助金を活用したい", "小売業", "葛城市"],
  ];

  return (
    <main className="two">
      <section className="panel">
 <a href="/" className="backBtn">
    ← トップページへ戻る
  </a>
        <h1>困りごと投稿</h1>
        <input placeholder="タイトル" />
        <select><option>集客</option><option>採用</option><option>補助金</option></select>
        <textarea placeholder="困っている内容を入力してください"></textarea>
        <button>投稿する</button>
      </section>

      <section className="panel">
        <h1>困りごと一覧</h1>
        {problems.map((p) => (
          <article className="post" key={p[0]}>
            <span>困りごと</span>
            <h3>{p[0]}</h3>
            <p>{p[1]} ／ {p[2]}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
