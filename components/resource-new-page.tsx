import type { ResourceConfig } from "@/types";
import { BackLink, PageHero } from "./ui";
import { ResourceForm } from "./resource-form";

export function ResourceNewPage({ config, dealId }: { config: ResourceConfig; dealId?: string | null }) {
  return (
    <main>
      <PageHero eyebrow={`New ${config.accent}`} title={`${config.label}を投稿`} description={config.intro} />
      <section className="page-content">
        <div className="container">
          <BackLink href={`/${config.table}`} />
          <div className="form-card">
            <h2>{config.label} 投稿フォーム</h2>
            <ResourceForm config={config} dealId={dealId} />
          </div>
        </div>
      </section>
    </main>
  );
}
