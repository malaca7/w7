import { copyFile, cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, ".output", "public");
const distDir = path.join(rootDir, "dist");
const assetsDir = path.join(publicDir, "assets");

async function findAsset(prefix, suffix) {
  const files = await readdir(assetsDir);
  const match = files.find((file) => file.startsWith(prefix) && file.endsWith(suffix));

  if (!match) {
    throw new Error(`Asset not found for ${prefix}*${suffix}`);
  }

  return `./assets/${match}`;
}

function buildHtml({ cssHref, scriptHref }) {
  return [
    "<!doctype html>",
    '<html lang="pt-BR" class="dark">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    '  <meta name="theme-color" content="#080808">',
    '  <title>W7 — Atendimento inteligente via WhatsApp</title>',
    '  <meta name="description" content="Plataforma SaaS premium de atendimento via WhatsApp.">',
    '  <meta property="og:site_name" content="W7">',
    '  <meta property="og:type" content="website">',
    '  <meta property="og:title" content="W7 — Atendimento Inteligente via WhatsApp">',
    '  <meta property="og:description" content="Plataforma SaaS premium multi-empresa com CRM, Chatbot Visual e Financeiro.">',
    '  <meta property="og:image" content="/og-image.png">',
    '  <meta name="twitter:card" content="summary_large_image">',
    '  <meta name="twitter:title" content="W7 — Atendimento Inteligente via WhatsApp">',
    '  <meta name="twitter:description" content="Plataforma SaaS premium multi-empresa com CRM, Chatbot Visual e Financeiro.">',
    '  <meta name="twitter:image" content="/og-image.png">',
    '  <link rel="preconnect" href="https://fonts.googleapis.com">',
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">',
    '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">',
    `  <link rel="stylesheet" href="${cssHref}">`,
    '  <link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '  <link rel="icon" href="/favicon.ico" type="image/x-icon">',
    '  <link rel="apple-touch-icon" href="/favicon.png">',
    "</head>",
    "<body>",
    `  <script type="module" src="${scriptHref}"></script>`,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(publicDir, distDir, { recursive: true });

const cssHref = await findAsset("styles-", ".css");
const scriptHref = await findAsset("index-", ".js");
const html = buildHtml({ cssHref, scriptHref });

await writeFile(path.join(distDir, "index.html"), html, "utf8");
await writeFile(path.join(distDir, "404.html"), html, "utf8");
await writeFile(path.join(distDir, ".nojekyll"), "", "utf8");
await copyFile(path.join(rootDir, "CNAME"), path.join(distDir, "CNAME"));

console.log("GitHub Pages artifact ready in dist/");