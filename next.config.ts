import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  output: "standalone",

  // ✅ Important: allow access from your IPs / domains
  allowedDevOrigins: [
    'local-origin.dev', '*.local-origin.dev',

    "localhost", "*localhost*",
    // "localhost", "http://localhost", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002",

    "dev3.box.com.pk", "*dev3.box.com.pk*",
    // "dev3.box.com.pk",
    // "http://dev3.box.com.pk",
    // "http://dev3.box.com.pk:3001",
    // "https://dev3.box.com.pk:3001",

    "192.168.18.10", "*192.168.18.10*",
    // "http://192.168.18.10",
    // "http://192.168.18.10:3000",
    // "http://192.168.18.10:3001",
    // "http://192.168.18.10:3002",

    "http://172.21.0.7:3000"
  ],

  // ✅ Required so the browser lets the page use navigator.usb
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Enables Web USB in iframes (optional, safe)
          { key: "Permissions-Policy", value: "usb=*" },
          // Required if you serve over HTTPS and the printer is a self-signed device
          { key: "Feature-Policy", value: "usb *" },
        ],
      },
    ];
  },

  reactCompiler: true,
  reactStrictMode: false, // Disables React Strict Mode (which causes double rendering in dev)

  turbopack: {
    rules: {
      "*.graphql": {
        loaders: ["graphql-tag/loader"],
        as: "*.js",
      },
      "*.gql": {
        loaders: ["graphql-tag/loader"],
        as: "*.js",
      },
    },
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "graphql-tag/loader",
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
