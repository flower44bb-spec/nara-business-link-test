import { ResourceEditPage } from "@/components/resource-edit-page";
import { resourceConfigs } from "@/lib/resource-config";

export default function EditCollaborationPage() {
  return <ResourceEditPage config={resourceConfigs.collaborations} />;
}
