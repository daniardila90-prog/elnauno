import { Montserrat, Barlow_Condensed } from "next/font/google";

export const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Sustituto de Avenir Next Condensed (no disponible como fuente web libre):
// misma intención condensada/geométrica para eyebrows y labels en mayúscula.
export const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
