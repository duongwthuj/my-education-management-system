/** @type {import('next').NextConfig} */
const config = {
  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Tree-shake MUI imports for smaller bundle
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },

  // Enable Emotion compiler optimization
  compiler: {
    emotion: true,
  },

  // API proxy configuration (optional - for development)
  // Uncomment if you want to proxy API requests through Next.js
  /*
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
  */
};

export default config;
