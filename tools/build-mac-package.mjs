import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const rootDir = new URL("..", import.meta.url).pathname;
const extensionDir = join(rootDir, "pgy-kol-collector");
const manifest = JSON.parse(readFileSync(join(extensionDir, "manifest.json"), "utf8"));
const distDir = join(rootDir, "dist");
const packageName = `pgy-kol-collector-mac-v${manifest.version}`;
const packageDir = join(distDir, packageName);
const appPath = join(packageDir, "PGY Collector.app");
const appSourcePath = join(rootDir, "mac", "PGYCollectorHelper.applescript");
const zipPath = join(distDir, `${packageName}.zip`);

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

rmSync(packageDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });
mkdirSync(join(packageDir, "pgy-kol-collector"), { recursive: true });

for (const relativePath of includePaths) {
  cpSync(join(extensionDir, relativePath), join(packageDir, "pgy-kol-collector", relativePath), {
    recursive: true,
    filter: source => basename(source) !== ".DS_Store"
  });
}

execFileSync("osacompile", ["-o", appPath, appSourcePath], { stdio: "inherit" });

writeFileSync(
  join(packageDir, "START_HERE.txt"),
  [
    "蒲公英采集助手 Mac 客户包",
    "",
    "1. 双击“蒲公英采集助手.app”。",
    "2. 选择“安装/更新插件”。",
    "3. 按弹窗提示在 Chrome 扩展页加载 pgy-kol-collector 文件夹。",
    "4. 回到工具，选择“打开蒲公英后台”。",
    "",
    "如果 macOS 提示无法打开，请右键点击 App，再选择“打开”。",
    "如果采集中断，请先不要刷新蒲公英页面，点击插件面板里的“诊断”，把复制内容和截图发给维护人员。"
  ].join("\n"),
  "utf8"
);

execFileSync("zip", ["-qr", zipPath, packageName], { cwd: distDir, stdio: "inherit" });

console.log(`已生成 Mac 客户包：${zipPath}`);
