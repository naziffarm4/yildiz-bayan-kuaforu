/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@yildiz/ui", "@yildiz/types"],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
