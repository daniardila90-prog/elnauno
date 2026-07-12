import Nav from "@/components/nauno/Nav";
import Hero from "@/components/nauno/Hero";
import Ubicacion from "@/components/nauno/Ubicacion";
import Galeria from "@/components/nauno/Galeria";
import Footer from "@/components/nauno/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Ubicacion />
        <Galeria />
      </main>
      <Footer />
    </>
  );
}
