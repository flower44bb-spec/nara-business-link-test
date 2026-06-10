import { ResourceEditPage } from "@/components/resource-edit-page";
import { resourceConfigs } from "@/lib/resource-config";

export default function EditProblemPage() {
  return <ResourceEditPage config={resourceConfigs.problems} />;
}
