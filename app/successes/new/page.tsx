import { ResourceNewPage } from "@/components/resource-new-page";
import { resourceConfigs } from "@/lib/resource-config";

export default async function NewSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ deal_id?: string }>;
}) {
  const params = await searchParams;
  return <ResourceNewPage config={resourceConfigs.successes} dealId={params?.deal_id || null} />;
}
