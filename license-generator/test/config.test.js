const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { loadFeishuConfig } = require("../src/config");

function fixture(t, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pgy-license-config-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const configPath = path.join(dir, "config.local.json");
  if (content !== undefined) fs.writeFileSync(configPath, content);
  return configPath;
}

const local = {
  feishuAppId: "test-local-id",
  feishuAppSecret: "test-local-secret",
  feishuBaseAppToken: "test-local-base"
};

test("loads optional local JSON when environment values are absent", t => {
  const configPath = fixture(t, JSON.stringify(local));
  assert.deepEqual(loadFeishuConfig({ env: {}, configPath }), local);
});

test("nonempty environment values override local JSON per field", t => {
  const configPath = fixture(t, JSON.stringify(local));
  assert.deepEqual(loadFeishuConfig({ env: { FEISHU_APP_SECRET: "test-env-secret" }, configPath }), {
    ...local,
    feishuAppSecret: "test-env-secret"
  });
});

test("complete environment configuration does not require a local file", t => {
  const configPath = fixture(t);
  assert.deepEqual(loadFeishuConfig({ configPath, env: {
    FEISHU_APP_ID: "test-env-id",
    FEISHU_APP_SECRET: "test-env-secret",
    FEISHU_BASE_APP_TOKEN: "test-env-base"
  } }), {
    feishuAppId: "test-env-id",
    feishuAppSecret: "test-env-secret",
    feishuBaseAppToken: "test-env-base"
  });
});

test("supports a local config path selected through the environment", t => {
  const configPath = fixture(t, JSON.stringify(local));
  assert.deepEqual(loadFeishuConfig({ env: { PGY_LICENSE_GENERATOR_CONFIG: configPath } }), local);
});

test("missing configuration identifies required names without exposing supplied values", t => {
  const configPath = fixture(t);
  assert.throws(() => loadFeishuConfig({ configPath, env: { FEISHU_APP_ID: "test-supplied-value" } }), error => {
    assert.match(error.message, /FEISHU_APP_SECRET/);
    assert.match(error.message, /FEISHU_BASE_APP_TOKEN/);
    assert.match(error.message, /config\.example\.json/);
    assert.doesNotMatch(error.message, /test-supplied-value/);
    return true;
  });
});

test("invalid JSON returns a friendly error without echoing file contents", t => {
  const configPath = fixture(t, '{"feishuAppSecret":"test-private-content",bad}');
  assert.throws(() => loadFeishuConfig({ env: {}, configPath }), error => {
    assert.match(error.message, /配置无法读取或格式无效/);
    assert.doesNotMatch(error.message, /test-private-content/);
    return true;
  });
});

test("non-object JSON configuration is rejected", t => {
  const configPath = fixture(t, "[]");
  assert.throws(() => loadFeishuConfig({ env: {}, configPath }), /配置无法读取或格式无效/);
});
