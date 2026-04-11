import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // LocatorJS (data-id): https://www.locatorjs.com/install/react-data-id
  turbopack: {
    rules: {
      "**/*.{tsx,jsx}": {
        condition: "development",
        loaders: [
          {
            loader: "@locator/webpack-loader",
            options: { env: "development" },
          },
        ],
      },
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.module.rules.push({
        test: /\.(tsx|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "@locator/webpack-loader",
            options: { env: "development" },
          },
        ],
      });
    }
    return config;
  },
};

export default nextConfig;
