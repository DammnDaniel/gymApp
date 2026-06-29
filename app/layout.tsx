import type { Metadata } from "next";
import { Archivo, Inter, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "GymApp",
  description: "Entrenamiento, rutinas y progreso.",
  themeColor: "#0a0b0d",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${inter.variable} ${splineMono.variable}`}
    >
      <body className="min-h-[100dvh] font-sans antialiased">
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
