import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sdkRoot = resolve(__dirname, "..");
const repoRoot = resolve(sdkRoot, "..", "..");
const openapiDir = resolve(sdkRoot, "openapi");
const generatedDir = resolve(sdkRoot, "src", "generated");

mkdirSync(openapiDir, { recursive: true });
mkdirSync(generatedDir, { recursive: true });

const require = createRequire(import.meta.url);
const {
  APP_PLATFORM_V1_OPENAPI,
} = require(resolve(
  repoRoot,
  "apps/web/src/lib/api-platform/openapi/app-platform-v1.ts",
));

const specPath = resolve(openapiDir, "app-platform-v1.json");
const generatedTypesPath = resolve(generatedDir, "app-platform-v1.ts");

writeFileSync(specPath, `${JSON.stringify(APP_PLATFORM_V1_OPENAPI, null, 2)}\n`);

execFileSync(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  [
    "exec",
    "openapi-typescript",
    specPath,
    "-o",
    generatedTypesPath,
  ],
  {
    cwd: sdkRoot,
    stdio: "inherit",
  },
);
