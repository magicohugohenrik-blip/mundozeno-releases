/**
 * Copia o build da aplicação web para desktop/webapp (modo offline do Electron).
 *
 * Uso: na raiz "npm run build", depois "cd desktop && npm run sync-web".
 *
 * Detecta automaticamente a estrutura real do build (TanStack Start + Nitro):
 *   - .output/public + .output/server/index.mjs   (build no Windows/Node)
 *   - dist/client    + dist/server/index.mjs      (build em nuvem)
 * Nenhuma delas gera index.html estático: ele é produzido rodando o servidor
 * do próprio build uma vez e salvando a página inicial.
 */
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { pathToFileURL } = require("node:url");

const root = path.join(__dirname, "..");
const target = path.join(__dirname, "webapp");

const SCRIPT_REVISION = "output-public-v2";
const LAYOUTS = [
  { name: "TanStack Start (.output)", client: ".output/public", server: ".output/server/index.mjs" },
  { name: "TanStack Start (dist)", client: "dist/client", server: "dist/server/index.mjs" },
].map((layout) => ({
  ...layout,
  client: path.join(root, layout.client),
  server: path.join(root, layout.server),
}));

function newest(list) {
  return list
    .filter((layout) => fs.existsSync(layout.client) && fs.existsSync(layout.server))
    .sort((a, b) => fs.statSync(b.client).mtimeMs - fs.statSync(a.client).mtimeMs)[0];
}

function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.once("error", rej);
    s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); });
  });
}

async function renderViaFetchExport(server) {
  const mod = await import(pathToFileURL(server).href);
  const h = mod.default;
  if (!h || typeof h.fetch !== "function") return null;
  const res = await h.fetch(new Request("http://localhost/"), {}, { waitUntil() {}, passThroughOnException() {} });
  if (!res.ok) throw new Error("status " + res.status);
  return res.text();
}

async function renderViaNodeServer(server) {
  const port = await freePort();
  const child = spawn(process.execPath, [server], {
    env: { ...process.env, PORT: String(port), NITRO_PORT: String(port), HOST: "127.0.0.1", NITRO_HOST: "127.0.0.1" },
    stdio: "ignore",
  });
  try {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const res = await fetch(`http://127.0.0.1:${port}/`);
        if (!res.ok) throw new Error("status " + res.status);
        return await res.text();
      } catch (e) {
        if (i === 59) throw e;
      }
    }
  } finally {
    child.kill();
  }
}

async function renderIndex(server) {
  const text = fs.readFileSync(server, "utf8");
  // Build Node (.output) sobe um servidor ao ser executado; build em nuvem exporta fetch.
  if (/export\s*\{[^}]*as default|export default/.test(text) && !/listen\(/.test(text)) {
    try { const html = await renderViaFetchExport(server); if (html) return html; } catch (e) { console.warn("Aviso: " + e.message); }
  }
  return renderViaNodeServer(server);
}

(async () => {
  console.log(`Mundo Zeno sync-web (${SCRIPT_REVISION})`);
  const layout = newest(LAYOUTS);
  if (!layout) {
    console.error("Build da aplicacao web nao encontrado.");
    console.error("Este script procura um destes pares completos:");
    for (const candidate of LAYOUTS) {
      console.error(`- ${path.relative(root, candidate.client)} + ${path.relative(root, candidate.server)}`);
    }
    console.error("Rode 'npm run build' na pasta raiz e depois execute novamente 'npm run sync-web' dentro de desktop.");
    process.exit(1);
  }
  console.log(`${layout.name} encontrado:`);
  console.log(`- arquivos publicos: ${path.relative(root, layout.client)}`);
  console.log(`- servidor: ${path.relative(root, layout.server)}`);

  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(layout.client, target, { recursive: true });

  if (!fs.existsSync(path.join(target, "index.html"))) {
    const html = await renderIndex(layout.server);
    if (!html || !/<script/i.test(html)) throw new Error("Pagina inicial gerada vazia.");
    fs.writeFileSync(path.join(target, "index.html"), html);
  }

  // Arquivos de public/ (capas, ícones) que porventura faltem.
  const pub = path.join(root, "public");
  if (fs.existsSync(pub)) {
    for (const entry of fs.readdirSync(pub)) {
      const dest = path.join(target, entry);
      if (!fs.existsSync(dest)) fs.cpSync(path.join(pub, entry), dest, { recursive: true });
    }
  }

  // Imagens hospedadas (/__l5e/...) são baixadas para funcionar sem internet.
  const found = new Set();
  const scan = (dir) => {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) scan(p);
      else if (/\.(js|html|css)$/.test(f))
        for (const m of fs.readFileSync(p, "utf8").matchAll(/\/__l5e\/[A-Za-z0-9_\-./]+/g)) found.add(m[0]);
    }
  };
  scan(target);
  const site = process.env.ZENO_URL || "https://turmadozeno.lovable.app";
  for (const u of found) {
    try {
      const r = await fetch(site + u);
      if (!r.ok) throw new Error(String(r.status));
      const dest = path.join(target, u);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      console.warn("Aviso: nao foi possivel baixar " + u + " (" + e.message + ")");
    }
  }

  const count = (d) => fs.readdirSync(d).reduce((n, f) => n + (fs.statSync(path.join(d, f)).isDirectory() ? count(path.join(d, f)) : 1), 0);
  console.log(`Pronto: ${count(target)} arquivos em desktop/webapp (modo offline pronto).`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
