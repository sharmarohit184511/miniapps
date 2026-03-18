import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["jsdom"],
  /** Stops Turbopack from using a parent folder’s lockfile as workspace root (fixes missing @supabase/supabase-js). */
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
