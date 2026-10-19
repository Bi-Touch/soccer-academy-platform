
const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),

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