/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*.app.github.dev", "localhost:3000"]
    }
  }
};

module.exports = nextConfig;