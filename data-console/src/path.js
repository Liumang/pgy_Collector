const os = require("os");
const path = require("path");

function defaultDataDir() {
  if (process.env.PGY_DATA_CONSOLE_DIR) return process.env.PGY_DATA_CONSOLE_DIR;
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "PGY Collector", "data");
  }
  return path.join(os.homedir(), ".pgy-collector", "data");
}

function defaultDbPath() {
  return path.join(defaultDataDir(), "pgy.db");
}

module.exports = { defaultDataDir, defaultDbPath };
