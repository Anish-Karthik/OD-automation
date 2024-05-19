/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "picsum.photos",
        protocol: "https",
      },
      {
        hostname: "utfs.io",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
