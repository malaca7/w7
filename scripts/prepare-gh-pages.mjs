import { copyFile, cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, ".output", "public");
const distDir = path.join(rootDir, "dist");

const staticRoutes = [
  "/",
  "/atendimento",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

async function loadSsrRenderer() {
  const ssrModulePath = pathToFileURL(
    path.join(rootDir, ".output", "server", "_ssr", "ssr.mjs"),
  ).href;

  const mod = await import(ssrModulePath);
  return mod.default;
}

function getOutputPath(routePath) {
  if (routePath === "/") {
    return path.join(distDir, "index.html");
  }

  const relativeRoute = routePath.replace(/^\//, "");
  return path.join(distDir, relativeRoute, "index.html");
}

async function renderRoute(ssr, routePath) {
  const response = await ssr.fetch(new Request(`http://localhost${routePath}`));

  if (!response.ok) {
    throw new Error(`SSR render failed for ${routePath}: ${response.status}`);
  }

  return response.text();
}

async function writeRouteHtml(ssr, routePath) {
  const html = await renderRoute(ssr, routePath);
  const outputPath = getOutputPath(routePath);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");

  return html;
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(publicDir, distDir, { recursive: true });

const ssr = await loadSsrRenderer();
let rootHtml = "";

for (const routePath of staticRoutes) {
  const html = await writeRouteHtml(ssr, routePath);
  if (routePath === "/") {
    rootHtml = html;
  }
}

await writeFile(path.join(distDir, "404.html"), rootHtml, "utf8");
await writeFile(path.join(distDir, ".nojekyll"), "", "utf8");
await copyFile(path.join(rootDir, "CNAME"), path.join(distDir, "CNAME"));

console.log("GitHub Pages artifact ready in dist/");
