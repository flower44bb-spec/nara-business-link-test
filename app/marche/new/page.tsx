import { MarcheForm } from "@/components/marche-form";
import { BackLink, PageHero } from "@/components/ui";

export default function NewMarchePage() {
  return (
    <main>
      <PageHero eyebrow="New Marche Post" title="マルシェ案件を投稿" description="開催情報と募集内容を登録してください。管理者承認後に公開されます。" />
      <section className="page-content">
        <div className="container">
          <BackLink href="/marche" />
          <div className="form-card"><MarcheForm /></div>
        </div>
      </section>
    </main>
  );
}
