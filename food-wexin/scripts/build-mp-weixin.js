const path = require("path");
const { spawn } = require("child_process");
const { normalizeDistProjectConfig } = require("./fix-mp-project-config");

const projectRoot = path.resolve(__dirname, "..");
const cliPath = path.join(projectRoot, "node_modules", "@vue", "cli-service", "bin", "vue-cli-service.js");

const child = spawn(
  process.execPath,
  [cliPath, "uni-build", "--minimize"],
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: "production",
      UNI_PLATFORM: "mp-weixin",
    },
    stdio: "inherit",
  },
);

child.on("exit", (code) => {
  try {
    normalizeDistProjectConfig();
  } catch (error) {
    console.warn("[fix-mp-config]", error.message);
  }
  process.exit(code ?? 0);
});
