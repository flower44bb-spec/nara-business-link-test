import { ResourceNewPage } from "@/components/resource-new-page";
import { resourceConfigs } from "@/lib/resource-config";

export default function NewProblemPage() {
  return <ResourceNewPage config={resourceConfigs.problems} />;
}
