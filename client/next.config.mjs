import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",           // Where the generated service worker files go
  register: true,           // Auto-register the service worker
  skipWaiting: true,        // Activate new service worker immediately (don't wait)
  disable: process.env.NODE_ENV === "development", // Disable in dev mode
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
