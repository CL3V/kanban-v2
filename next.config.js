/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode to avoid third-party library setState warnings in dev
  reactStrictMode: false,
  env: {
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    CSRF_SECRET: process.env.CSRF_SECRET,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  },
};

module.exports = nextConfig;
