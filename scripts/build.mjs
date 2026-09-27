// Builds dist/: ESM and CommonJS with their own declarations, and the
// browser bundle. The CommonJS folder is marked as such so TypeScript reads
// its declarations as CommonJS too.
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";

const run = (bin, args) =>
  execFileSync(`node_modules/.bin/${bin}`, args, { stdio: "inherit" });

rmSync("dist", { recursive: true, force: true });
run("tsup", []);
for (const dir of ["dist/esm", "dist/cjs"]) {
  run("tsc", ["-p", "tsconfig.build.json", "--outDir", dir]);
}
writeFileSync("dist/cjs/package.json", '{ "type": "commonjs" }\n');
