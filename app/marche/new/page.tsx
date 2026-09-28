import { MarcheForm } from "@/components/marche-form";
import { BackLink, PageHero } from "@/components/ui";

export default function NewMarchePage() {
  return (
    <main>
      <PageHero eyebrow="New PR Post" title="PRを投稿" description="奈良県内のマルシェや地域イベント、出店募集や企業のPR、各青年部・企業主催イベントを登録してください。投稿後すぐに公開されます。" />
      <section className="page-content">
        <div className="container">
          <BackLink href="/marche" />
          <div className="form-card"><MarcheForm /></div>
        </div>
      </section>
    </main>
  );
}
