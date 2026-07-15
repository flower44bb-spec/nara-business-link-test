import { MarcheForm } from "@/components/marche-form";
import { BackLink, PageHero } from "@/components/ui";

export default function NewMarchePage() {
  return (
    <main>
      <PageHero eyebrow="New Event Post" title="イベント情報を投稿" description="マルシェ、地域イベント、出店募集、青年部や企業主催イベントの情報を登録してください。管理者承認後に公開されます。" />
      <section className="page-content">
        <div className="container">
          <BackLink href="/marche" />
          <div className="form-card"><MarcheForm /></div>
        </div>
      </section>
    </main>
  );
}
