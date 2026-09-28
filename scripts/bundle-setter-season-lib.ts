import * as esbuild from "esbuild";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const outfile = path.join(ROOT, "public/agent/setter-season-lib.mjs");

async function main() {
  await esbuild.build({
    entryPoints: [path.join(ROOT, "src/lib/setter-season/browser-entry.ts")],
    bundle: true,
    format: "esm",
    platform: "browser",
    outfile,
    tsconfig: path.join(ROOT, "tsconfig.json"),
  });
  console.log(`Bundled ${outfile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
