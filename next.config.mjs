/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // No ESLint config is included, so do not make the production build depend on it.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
