import { Plus } from "lucide-react";
import Link from "next/link";
import { BusinessList } from "@/components/business-list";
import { HomeLink, PageHero } from "@/components/ui";

export default function BusinessesPage() {
  return (
    <main>
      <PageHero
        eyebrow="Business Directory"
        title="事業者を探す"
        description="奈良県内で活躍する青年部員の事業や得意分野から、相談相手・取引先・協業パートナーを探せます。"
      />
      <section className="page-content">
        <div className="container">
          <HomeLink />
          <div className="toolbar">
            <h2>登録事業者</h2>
            <Link className="button" href="/businesses/new"><Plus size={17} /> 新規登録</Link>
          </div>
          <BusinessList />
        </div>
      </section>
    </main>
  );
}
