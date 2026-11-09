import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const rootDir = new URL("..", import.meta.url).pathname;
const sourceDir = join(rootDir, "pgy-kol-collector");
const manifest = JSON.parse(readFileSync(join(sourceDir, "manifest.json"), "utf8"));
const distDir = join(rootDir, "dist");
const workDir = join(distDir, "work");
const packageName = "pgy-kol-collector";
const packageDir = join(workDir, packageName);
const zipName = `${packageName}-v${manifest.version}.zip`;
const zipPath = join(distDir, zipName);

const includePaths = [
  "manifest.json",
  "content.js",
  "content.css",
  "background.js",
  "hook.js",
  "README.md",
  "icons"
];

execFileSync("node", [join(rootDir, "tools/check-extension.mjs")], { stdio: "inherit" });

rmSync(workDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });
mkdirSync(packageDir, { recursive: true });

for (const relativePath of includePaths) {
  cpSync(join(sourceDir, relativePath), join(packageDir, relativePath), {
    recursive: true,
    filter: source => basename(source) !== ".DS_Store"
  });
}

mkdirSync(distDir, { recursive: true });
execFileSync("zip", ["-qr", zipPath, packageName], { cwd: workDir, stdio: "inherit" });
rmSync(workDir, { recursive: true, force: true });

console.log(`已生成交付包：${zipPath}`);
