import { defineConfig, Format } from "tsup";

const options = {
  splitting: false,
  bundle: false,
  clean: true,
  sourcemap: true,
  dts: true,
  format: ["esm"] as Format[],
};

export default defineConfig([
  {
    ...options,
    entry: ["./src/**"],
    outDir: "dist",
  },
]);
