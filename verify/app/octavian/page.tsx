import OctavianMesh from "@/components/octavian-mesh";
import { SkinProvider } from "@/components/skin-provider";

export const metadata = { title: "Octavian — MAD Gambit global state" };

export default function OctavianPage() {
  return (
    <SkinProvider>
      <main style={{ minHeight: "100vh", padding: 16 }}>
        <OctavianMesh />
      </main>
    </SkinProvider>
  );
}
