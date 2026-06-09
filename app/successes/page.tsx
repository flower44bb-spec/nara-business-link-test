import { ResourcePage } from "@/components/resource-page";
import { resourceConfigs } from "@/lib/resource-config";

export default function SuccessesPage() {
  return <ResourcePage config={resourceConfigs.successes} />;
}
