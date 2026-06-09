import { Plus } from "lucide-react";
import Link from "next/link";
import type { ResourceConfig } from "@/types";
import { HomeLink, PageHero } from "./ui";
import { ResourceList } from "./resource-list";

export function ResourcePage({ config }: { config: ResourceConfig }) {
  return (
    <main>
      <PageHero eyebrow={config.accent} title={config.label} description={config.intro} />
      <section className="page-content">
        <div className="container">
          <HomeLink />
          <div className="toolbar">
            <h2>{config.label}一覧</h2>
            <Link className="button" href={`/${config.table}/new`}><Plus size={17} /> 新規投稿</Link>
          </div>
          <ResourceList config={config} />
        </div>
      </section>
    </main>
  );
}
