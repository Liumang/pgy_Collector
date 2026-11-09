import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = new URL("..", import.meta.url).pathname;
const extensionDir = join(rootDir, "pgy-kol-collector");
const manifestPath = join(extensionDir, "manifest.json");
const contentPath = join(extensionDir, "content.js");
const backgroundPath = join(extensionDir, "background.js");
const hookPath = join(extensionDir, "hook.js");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const content = readFileSync(contentPath, "utf8");
const versionMatch = content.match(/const VERSION = "([^"]+)"/);

if (!versionMatch) {
  throw new Error("content.js 中没有找到 VERSION 常量");
}

if (versionMatch[1] !== manifest.version) {
  throw new Error(`版本不一致：manifest=${manifest.version}, content.js=${versionMatch[1]}`);
}

for (const file of [contentPath, backgroundPath, hookPath]) {
  execFileSync("node", ["--check", file], { stdio: "inherit" });
}

console.log(`检查通过：蒲公英达人采集助手 v${manifest.version}`);
