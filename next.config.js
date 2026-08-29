/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@deriv/core'],
  output: 'standalone',
  // The preview is served through a proxy hostname that changes whenever the
  // environment is recreated. Next.js gates dev assets/HMR by ORIGIN, so allow
  // the preview origin derived from the Base44 public host suffix. A bare '*'
  // does NOT match (wildcards only cover subdomains).
  allowedDevOrigins: process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? ['3000-' + process.env.BASE44_PUBLIC_HOST_SUFFIX]
    : [],
}

module.exports = nextConfig
