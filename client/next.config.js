/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundled into the Capacitor Android shell (no Node server at runtime).
  output: "export",
  // Emit `/route/index.html` so the Capacitor local server resolves deep links.
  trailingSlash: true,
  images: {
    // The static export has no image optimisation server.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

module.exports = nextConfig;
