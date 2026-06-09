import { ResourceNewPage } from "@/components/resource-new-page";
import { resourceConfigs } from "@/lib/resource-config";

export default function NewCollaborationPage() {
  return <ResourceNewPage config={resourceConfigs.collaborations} />;
}
