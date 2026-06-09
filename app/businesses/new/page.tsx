import { BusinessForm } from "@/components/business-form";
import { BackLink, PageHero } from "@/components/ui";

export default function NewBusinessPage() {
  return (
    <main>
      <PageHero eyebrow="Register" title="事業者を登録" description="あなたの事業や得意分野を登録して、青年部の仲間との新しいつながりをつくりましょう。" />
      <section className="page-content">
        <div className="container">
          <BackLink href="/businesses" />
          <div className="form-card">
            <h2>事業者情報</h2>
            <BusinessForm />
          </div>
        </div>
      </section>
    </main>
  );
}
