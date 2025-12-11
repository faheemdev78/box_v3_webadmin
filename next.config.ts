import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'local-origin.dev', '*.local-origin.dev',
    
    "localhost",
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",

    "dev3.box.com.pk*",
    "dev3.box.com.pk",
    "http://dev3.box.com.pk",
    "http://dev3.box.com.pk:3001",
    "https://dev3.box.com.pk:3001",
    
    "192.168.18.10",
    "http://192.168.18.10",
    "http://192.168.18.10:3000",
    "http://192.168.18.10:3001",
    "http://192.168.18.10:3002",
    
    "http://172.21.0.7:3000"
  ],


};


export default nextConfig;
