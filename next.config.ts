import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Opportunity images uploaded from the admin panel live in Vercel Blob.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async redirects() {
    return [
      // The preferences quiz was replaced by the chef qualification questionnaire.
      { source: "/quiz", destination: "/onboarding", permanent: false },
    ];
  },
};

export default nextConfig;
