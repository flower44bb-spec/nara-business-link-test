import { ResourceEditPage } from "@/components/resource-edit-page";
import { resourceConfigs } from "@/lib/resource-config";

export default function EditSuccessPage() {
  return <ResourceEditPage config={resourceConfigs.successes} />;
}
