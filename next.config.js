/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse'],
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
}

module.exports = nextConfig