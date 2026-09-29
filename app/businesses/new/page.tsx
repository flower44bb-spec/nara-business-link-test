import { BusinessForm } from "@/components/business-form";
import { BackLink, PageHero } from "@/components/ui";

export default function NewBusinessPage() {
  return (
    <main>
      <PageHero eyebrow="Register" title="事業者を追加登録" description="会社・店舗・事業・サービスごとに複数登録できます。それぞれの特徴や得意分野を分けて掲載しましょう。" />
      <section className="page-content">
        <div className="container">
          <BackLink href="/businesses/mine" />
          <div className="form-card">
            <h2>新しい事業者情報</h2>
            <p className="draft-note">同じ会員アカウントから何件でも追加できます。既存の登録内容は上書きされません。</p>
            <BusinessForm />
          </div>
        </div>
      </section>
    </main>
  );
}
