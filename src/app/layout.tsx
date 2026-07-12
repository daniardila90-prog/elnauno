import type { Metadata } from "next";
import { montserrat, barlowCondensed } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "El Nauno Reserva",
  description:
    "Complejo residencial y hotelero en el entorno del embalse de Topocoro, Santander. Villas, hotel, terrazas y áreas comerciales rodeadas de naturaleza.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${montserrat.variable} ${barlowCondensed.variable} antialiased`}>
      <body className="bg-white text-forest font-sans">{children}</body>
    </html>
  );
}
