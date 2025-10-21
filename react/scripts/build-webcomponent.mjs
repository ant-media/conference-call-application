import { build, context } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const entry = path.join(rootDir, "src", "webcomponent-entry.js");
const outdir = path.join(rootDir, "dist", "react-mfe");

const isWatch = process.argv.includes("--watch");

const commonOptions = {
  entryPoints: [entry],
  bundle: true,
  format: "iife",
  globalName: "ConferenceReactMFE",
  sourcemap: true,
  outdir,
  entryNames: "react-mfe",
  assetNames: "assets/[name]-[hash]",
  publicPath: "/assets/react-mfe",
  jsx: "automatic",
  jsxImportSource: "react",
  loader: {
    ".js": "jsx",
    ".css": "text",
    ".svg": "file",
    ".png": "file",
    ".jpg": "file",
    ".jpeg": "file",
    ".gif": "file",
    ".webp": "file",
    ".ttf": "file",
    ".woff": "file",
    ".woff2": "file",
    ".mp3": "file",
    ".mp4": "file"
  },
  banner: {
    js: `// Browser shims for Node-like globals\n` +
        `window.global = window.global || window;\n` +
        `window.process = window.process || { env: { NODE_ENV: '${process.env.NODE_ENV || "production"}' } };\n`
  },
  banner: {
    js: `// Browser shims for Node-like globals\n` +
        `var global = window;\n` +
        `var process = window.process || { env: { NODE_ENV: '${process.env.NODE_ENV || "production"}' } };\n`
  },
  alias: {
    "Components": path.join(rootDir, "src", "Components"),
    "styles": path.join(rootDir, "src", "styles"),
    "pages": path.join(rootDir, "src", "pages"),
    "CustomRoutes": path.join(rootDir, "src", "CustomRoutes"),
    "utils": path.join(rootDir, "src", "utils"),
    "react": path.join(rootDir, "node_modules", "react"),
    "react-dom": path.join(rootDir, "node_modules", "react-dom")
  },
  absWorkingDir: rootDir,
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
    "process.env.REACT_APP_FORCE_THEME": JSON.stringify(process.env.REACT_APP_FORCE_THEME || "")
  }
};

async function run() {
  if (isWatch) {
    const ctx = await context(commonOptions);
    await ctx.watch();
    // Keep process alive
    console.log("Watching web component build...");
  } else {
    await build(commonOptions);
    console.log("Built web component to:", outdir);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


