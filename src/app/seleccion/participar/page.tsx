import type { Metadata } from "next";
import Nav from "@/components/nauno/Nav";
import WizardShell from "@/components/seleccion/WizardShell";

export const metadata: Metadata = {
  title: "Participar — Selección arquitectónica Hotel El Nauno",
};

export default function ParticiparPage() {
  return (
    <>
      <Nav alwaysSolid />
      <main className="min-h-screen bg-white pt-16">
        <WizardShell />
      </main>
    </>
  );
}
