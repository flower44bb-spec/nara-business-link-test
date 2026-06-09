import { ResourcePage } from "@/components/resource-page";
import { resourceConfigs } from "@/lib/resource-config";

export default function ProblemsPage() {
  return <ResourcePage config={resourceConfigs.problems} />;
}
