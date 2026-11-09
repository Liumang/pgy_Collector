import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const desktopDir = new URL("..", import.meta.url).pathname;
const rootDir = join(desktopDir, "..");
const dataConsoleDir = join(rootDir, "data-console");
const packageJson = JSON.parse(readFileSync(join(desktopDir, "package.json"), "utf8"));
const electronApp = join(desktopDir, "node_modules/electron/dist/Electron.app");
const distDir = join(rootDir, "dist");
const appName = "PGY Collector Desktop";
const outputApp = join(distDir, `${appName}.app`);
const resourcesDir = join(outputApp, "Contents/Resources");
const appResourceDir = join(resourcesDir, "app");
const iconPath = join(desktopDir, "assets", "app.icns");
const zipPath = join(distDir, `pgy-collector-desktop-mac-v${packageJson.version}.zip`);

if (!existsSync(electronApp)) {
  throw new Error("没有找到 Electron.app，请先安装桌面工具运行依赖");
}

execFileSync("npm", ["run", "check"], { cwd: desktopDir, stdio: "inherit" });
if (existsSync(dataConsoleDir)) {
  execFileSync("npm", ["run", "check"], { cwd: dataConsoleDir, stdio: "inherit" });
  execFileSync("npm", ["run", "build"], { cwd: dataConsoleDir, stdio: "inherit" });
}

rmSync(outputApp, { recursive: true, force: true });
rmSync(zipPath, { force: true });
mkdirSync(distDir, { recursive: true });
cpSync(electronApp, outputApp, { recursive: true, verbatimSymlinks: true });

rmSync(appResourceDir, { recursive: true, force: true });
mkdirSync(appResourceDir, { recursive: true });
cpSync(join(desktopDir, "package.json"), join(appResourceDir, "package.json"));
cpSync(join(desktopDir, "src"), join(appResourceDir, "src"), { recursive: true });
if (existsSync(iconPath)) cpSync(iconPath, join(resourcesDir, "app.icns"));
if (existsSync(dataConsoleDir)) {
  const dataConsoleResourceDir = join(resourcesDir, "data-console");
  rmSync(dataConsoleResourceDir, { recursive: true, force: true });
  cpSync(dataConsoleDir, dataConsoleResourceDir, {
    recursive: true,
    filter: source => (
      !source.includes(`${join("data-console", "test")}`) &&
      !source.includes(`${join("node_modules", ".bin")}`) &&
      !source.endsWith("preview.png")
    )
  });
  execFileSync("npm", [
    "rebuild",
    "better-sqlite3",
    "--runtime=electron",
    `--target=${packageJson.devDependencies.electron.replace(/^[^\d]*/, "")}`,
    "--dist-url=https://electronjs.org/headers"
  ], { cwd: dataConsoleResourceDir, stdio: "inherit" });
}

const plistPath = join(outputApp, "Contents/Info.plist");
execFileSync("/usr/libexec/PlistBuddy", ["-c", `Set :CFBundleName ${appName}`, plistPath]);
execFileSync("/usr/libexec/PlistBuddy", ["-c", `Set :CFBundleDisplayName ${appName}`, plistPath]);
execFileSync("/usr/libexec/PlistBuddy", ["-c", "Set :CFBundleIdentifier com.sheenzen.pgycollector.desktop", plistPath]);
execFileSync("/usr/libexec/PlistBuddy", ["-c", `Set :CFBundleShortVersionString ${packageJson.version}`, plistPath]);
execFileSync("/usr/libexec/PlistBuddy", ["-c", "Set :CFBundleIconFile app.icns", plistPath]);

execFileSync("codesign", ["--force", "--deep", "--sign", "-", outputApp], { stdio: "inherit" });
execFileSync("ditto", ["-c", "-k", "--keepParent", `${appName}.app`, zipPath], { cwd: distDir, stdio: "inherit" });

console.log(`已生成桌面版 Mac App：${outputApp}`);
console.log(`已生成桌面版交付包：${zipPath}`);
