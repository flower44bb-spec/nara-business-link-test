import { ResourceDetail } from "@/components/resource-detail";
import { resourceConfigs } from "@/lib/resource-config";

export default function SuccessDetailPage() {
  return <ResourceDetail config={resourceConfigs.successes} />;
}
