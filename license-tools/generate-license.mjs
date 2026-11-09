import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PRODUCT_ID = "pgy-blogger-collector";
console.error("提示：命令行脚本只生成授权码，不会自动写入飞书。正式使用请打开授权码生成器 App。");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const privateKeyPath = path.join(__dirname, "private-key.pem");

function usage() {
  console.log(`用法：
node license-tools/generate-license.mjs --customer "客户名" --days 30
node license-tools/generate-license.mjs --customer "客户名" --days 30 --quantity 10
node license-tools/generate-license.mjs --customer "客户名" --expires 2026-12-31
node license-tools/generate-license.mjs --customer "客户名" --permanent
`);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function hasArg(name) {
  return process.argv.includes(name);
}

function bufferToBase64Url(buffer) {
  return Buffer.from(buffer).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function dateFromDays(daysText) {
  const days = Number(daysText);
  if (!Number.isFinite(days) || days <= 0) return "";
  const date = new Date();
  date.setDate(date.getDate() + Math.round(days));
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

function dateFromExpires(expiresText) {
  if (!expiresText) return "";
  const date = new Date(`${expiresText}T23:59:59.999+08:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

const customer = argValue("--customer").trim();
const days = argValue("--days").trim();
const expires = argValue("--expires").trim();
const quantity = Math.max(1, Math.min(500, Math.round(Number(argValue("--quantity") || 1))));
const permanent = hasArg("--permanent");

if (!customer || (!days && !expires && !permanent)) {
  usage();
  process.exit(1);
}

const expiresAt = permanent ? "" : (days ? dateFromDays(days) : dateFromExpires(expires));
if (!permanent && !expiresAt) {
  console.error("到期时间无效，请检查 --days 或 --expires。");
  process.exit(1);
}

const durationLabel = permanent ? "永久" : expires ? `至 ${expires}` : `${days} 天`;

const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath, "utf8"));

for (let index = 0; index < quantity; index += 1) {
  const payload = {
    product: PRODUCT_ID,
    licenseId: crypto.randomUUID(),
    customer,
    issuedAt: new Date().toISOString(),
    durationDays: days || "",
    durationLabel,
    expiresAt
  };
  const payloadPart = bufferToBase64Url(Buffer.from(JSON.stringify(payload)));
  const signaturePart = bufferToBase64Url(crypto.sign(null, Buffer.from(payloadPart), privateKey));
  const licenseCode = `${payloadPart}.${signaturePart}`;
  if (quantity === 1) {
    console.log("授权信息：");
    console.log(JSON.stringify(payload, null, 2));
    console.log("");
    console.log("授权码：");
  }
  console.log(licenseCode);
}
