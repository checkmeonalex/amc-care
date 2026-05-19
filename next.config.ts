import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",  value: "on" },
  { key: "X-Frame-Options",         value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",  value: "nosniff" },
  { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
  {
    key:   "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key:   "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js runtime requires inline scripts; no external script hosts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // CSS modules and Next.js inject inline styles
      "style-src 'self' 'unsafe-inline'",
      // Self-hosted fonts (next/font downloads at build time)
      "font-src 'self'",
      // Images: same origin + data URIs (OCR canvas) + blob (file preview)
      "img-src 'self' data: blob:",
      // All API calls go to our own origin — AI calls are made server-side
      "connect-src 'self'",
      // No plugins
      "object-src 'none'",
      // Prevent base tag hijacking
      "base-uri 'self'",
      // Form submissions only to same origin
      "form-action 'self'",
      // No embedding in iframes from other origins
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
