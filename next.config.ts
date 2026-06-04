import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // 关闭严格模式：不用执行两次useEffect
  reactStrictMode: false,
  // 关闭 powered by header：https://nextjs.org/docs/advanced-features/hidden-headers#powered-by-header
  poweredByHeader: false,
  // 生产环境关闭 source map
  productionBrowserSourceMaps: false,
};

export default nextConfig;
