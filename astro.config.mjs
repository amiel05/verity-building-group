import { defineConfig } from "astro/config";
import node from "@astrojs/node";
export default defineConfig({
  output: "server",
  adapter: node({ mode: "middleware" }),
  trailingSlash: "ignore",
  security: {
    allowedDomains: [
      {
        hostname: "verity-building-group-staging-staging.up.railway.app",
        protocol: "https",
      },
      { hostname: "veritybuildinggroup.com", protocol: "https" },
      { hostname: "www.veritybuildinggroup.com", protocol: "https" },
      { hostname: "localhost", protocol: "http" },
      { hostname: "127.0.0.1", protocol: "http" },
    ],
  },
  server: { host: "0.0.0.0" },
  devToolbar: { enabled: false },
});
