import nextPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const withPWA = nextPWA({
  dest: "public",
  disable: !isProd
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

export default withPWA(nextConfig);
