import { ResourcePage } from "@/components/resource-page";
import { resourceConfigs } from "@/lib/resource-config";

export default function CollaborationsPage() {
  return <ResourcePage config={resourceConfigs.collaborations} />;
}
