import { ResourceDetail } from "@/components/resource-detail";
import { resourceConfigs } from "@/lib/resource-config";

export default function CollaborationDetailPage() {
  return <ResourceDetail config={resourceConfigs.collaborations} />;
}
