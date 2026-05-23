const path = require("path");
const { spawn } = require("child_process");
const { normalizeDistProjectConfig } = require("./fix-mp-project-config");

const projectRoot = path.resolve(__dirname, "..");
const cliPath = path.join(projectRoot, "node_modules", "@vue", "cli-service", "bin", "vue-cli-service.js");

function patchDistConfig() {
  try {
    normalizeDistProjectConfig();
  } catch (error) {
    console.warn("[fix-mp-config]", error.message);
  }
}

patchDistConfig();

const buildArgs = ["uni-build", "--watch"];

// 小程序压缩开发包：只在显式脚本开启时压缩，避免日常 watch 热更新变慢。
if (process.env.UNI_MINIMIZE === "true") {
  buildArgs.push("--minimize");
}

const child = spawn(
  process.execPath,
  [cliPath, ...buildArgs],
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: "development",
      UNI_PLATFORM: "mp-weixin",
    },
    stdio: "inherit",
  },
);

const timer = setInterval(patchDistConfig, 1500);

child.on("exit", (code) => {
  clearInterval(timer);
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  clearInterval(timer);
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  clearInterval(timer);
  child.kill("SIGTERM");
});
