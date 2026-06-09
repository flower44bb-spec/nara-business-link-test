import { ResourceDetail } from "@/components/resource-detail";
import { resourceConfigs } from "@/lib/resource-config";

export default function ProblemDetailPage() {
  return <ResourceDetail config={resourceConfigs.problems} />;
}
