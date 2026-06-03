import type { NextConfig } from "next";

// Pod GitHub Pages: statyczny export do out/.
// Dla site'u głównego (intern-praktyki.github.io) basePath = "".
// Dla project page nadpisywalne zmienną NEXT_PUBLIC_BASE_PATH w workflow.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
