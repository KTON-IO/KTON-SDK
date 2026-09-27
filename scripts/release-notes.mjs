// Prints the CHANGELOG.md section for a version, as the GitHub release notes.
// GitHub renders every newline in release notes as a line break, so lines the
// changelog wraps at 80 columns are joined back. Fails if there is no section.
//
//   node scripts/release-notes.mjs 2.0.0
import { readFileSync } from "node:fs";

const version = process.argv[2]?.replace(/^v/, "");
const lines = readFileSync("CHANGELOG.md", "utf8").split("\n");
const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
if (!version || start < 0) {
  console.error(`CHANGELOG.md has no section for ${version}`);
  process.exit(1);
}
const length = lines
  .slice(start + 1)
  .findIndex((l) => l.startsWith("## ") || l === "---");

const out = [];
let fence = false;
let joinable = false;
for (const line of lines.slice(
  start + 1,
  length < 0 ? undefined : start + 1 + length,
)) {
  if (line.startsWith("```")) fence = !fence;
  const block =
    fence || line.startsWith("```") || /^\s*([-*>#|]|\d+\.)\s/.test(line);
  if (joinable && !block && line.trim()) {
    out[out.length - 1] += ` ${line.trim()}`;
    continue;
  }
  out.push(line);
  joinable =
    !fence &&
    !line.startsWith("```") &&
    !line.startsWith("#") &&
    line.trim() !== "";
}
console.log(out.join("\n").trim());
