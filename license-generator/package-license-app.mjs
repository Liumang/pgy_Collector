import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const appDir = new URL(".", import.meta.url).pathname;
const rootDir = join(appDir, "..");
const packageJson = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
const electronApp = join(rootDir, "desktop", "node_modules", "electron", "dist", "Electron.app");
const distDir = join(rootDir, "dist");
const appName = "PGY License Generator";
const outputApp = join(distDir, `${appName}.app`);
const resourcesDir = join(outputApp, "Contents", "Resources");
const appResourceDir = join(resourcesDir, "app");
const iconPath = join(rootDir, "desktop", "assets", "app.icns");
const zipPath = join(distDir, `pgy-license-generator-mac-v${packageJson.version}.zip`);

if (!existsSync(electronApp)) {
  throw new Error("没有找到 Electron.app，请先安装桌面工具运行依赖");
}

execFileSync("node", ["--check", "src/main.js"], { cwd: appDir, stdio: "inherit" });
execFileSync("node", ["--check", "src/preload.js"], { cwd: appDir, stdio: "inherit" });
execFileSync("node", ["--check", "src/renderer.js"], { cwd: appDir, stdio: "inherit" });

rmSync(outputApp, { recursive: true, force: true });
rmSync(zipPath, { force: true });
mkdirSync(distDir, { recursive: true });
cpSync(electronApp, outputApp, { recursive: true, verbatimSymlinks: true });

rmSync(appResourceDir, { recursive: true, force: true });
mkdirSync(appResourceDir, { recursive: true });
cpSync(join(appDir, "package.json"), join(appResourceDir, "package.json"));
cpSync(join(appDir, "private-key.pem"), join(appResourceDir, "private-key.pem"));
cpSync(join(appDir, "src"), join(appResourceDir, "src"), { recursive: true });
if (existsSync(iconPath)) cpSync(iconPath, join(resourcesDir, "app.icns"));

const plistPath = join(outputApp, "Contents", "Info.plist");
execFileSync("/usr/libexec/PlistBuddy", ["-c", `Set :CFBundleName ${appName}`, plistPath]);
execFileSync("/usr/libexec/PlistBuddy", ["-c", "Set :CFBundleDisplayName 授权码生成器", plistPath]);
execFileSync("/usr/libexec/PlistBuddy", ["-c", "Set :CFBundleIdentifier com.sheenzen.pgycollector.licensegenerator", plistPath]);
execFileSync("/usr/libexec/PlistBuddy", ["-c", `Set :CFBundleShortVersionString ${packageJson.version}`, plistPath]);
execFileSync("/usr/libexec/PlistBuddy", ["-c", "Set :CFBundleIconFile app.icns", plistPath]);

execFileSync("codesign", ["--force", "--deep", "--sign", "-", outputApp], { stdio: "inherit" });
execFileSync("ditto", ["-c", "-k", "--keepParent", `${appName}.app`, zipPath], { cwd: distDir, stdio: "inherit" });

console.log(`已生成授权码生成器 Mac App：${outputApp}`);
console.log(`已生成授权码生成器交付包：${zipPath}`);
