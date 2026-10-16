import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Perheappi",
    short_name: "Perheappi",
    description: "Perheen yhteinen ostoslista, ruokalista, reseptit ja kalenteri",
    lang: "fi",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff8ef",
    theme_color: "#fff8ef",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Ostoslista", url: "/ostokset", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Ruokalista", url: "/ruoka", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Kalenteri", url: "/kalenteri", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
