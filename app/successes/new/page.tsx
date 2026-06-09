import { ResourceNewPage } from "@/components/resource-new-page";
import { resourceConfigs } from "@/lib/resource-config";

export default function NewSuccessPage() {
  return <ResourceNewPage config={resourceConfigs.successes} />;
}
