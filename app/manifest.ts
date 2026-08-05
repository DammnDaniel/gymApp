import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Training Log",
    short_name: "Training Log",
    description: "Tu cuaderno de entrenamiento, rutinas y progreso.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ecece5",
    theme_color: "#ecece5",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/mark.svg", sizes: "any", type: "image/svg+xml" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
