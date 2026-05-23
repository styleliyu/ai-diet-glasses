const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "unpackage", "dist", "dev", "mp-weixin");
const distProjectConfigPath = path.join(distRoot, "project.config.json");

function normalizeDistProjectConfig() {
  if (!fs.existsSync(distRoot) || !fs.existsSync(distProjectConfigPath)) {
    return false;
  }

  const raw = fs.readFileSync(distProjectConfigPath, "utf8");
  const config = JSON.parse(raw);
  let changed = false;

  if (config.miniprogramRoot !== "") {
    config.miniprogramRoot = "";
    changed = true;
  }

  if (config.srcMiniprogramRoot !== "") {
    config.srcMiniprogramRoot = "";
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(distProjectConfigPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }

  return changed;
}

if (require.main === module) {
  const changed = normalizeDistProjectConfig();
  console.log(changed ? "Fixed mp-weixin project.config.json" : "mp-weixin project.config.json already ok");
}

module.exports = {
  normalizeDistProjectConfig,
};
