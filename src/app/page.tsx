import Dashboard from "@/components/Dashboard";
import { org } from "@/lib/org";

export default function Home() {
  return <Dashboard orgName={org.name} />;
}
