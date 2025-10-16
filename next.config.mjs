/** @type {import('next').NextConfig} */
const config = {
  // Enable TypeScript path aliases with @/ prefix
  webpack: (config) => {
    return config;
  },
  // Handle file extensions properly in imports
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  }
};

export default config;
