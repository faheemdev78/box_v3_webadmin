import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'local-origin.dev', '*.local-origin.dev',
    
    "localhost",
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    
    "192.168.18.10",
    "http://192.168.18.10",
    "http://192.168.18.10:3000",
    "http://192.168.18.10:3001",
    "http://192.168.18.10:3002",
    
    "http://172.21.0.7:3000"
  ],

  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'graphql-tag/loader',
        },
      ],
    });
    return config;
  },

  // webpackDevMiddleware: config => {
  //   return config;
  // },
  // Optional: If using custom module aliases like @_/
  resolve: {
    alias: {
      '@_': path.resolve(__dirname, 'src'),
    },
  },
};

export default nextConfig;
