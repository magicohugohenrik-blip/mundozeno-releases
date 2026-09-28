export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Esta página não carregou</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 16px/1.6 system-ui, -apple-system, sans-serif; background: #0b1020; color: #f8fafc; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 30rem; width: 100%; text-align: center; padding: 2rem; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14); border-radius: 1.5rem; }
      h1 { font-size: 1.4rem; margin: 0 0 0.5rem; }
      p { color: #cbd5e1; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap; }
      a, button { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border-radius: 999px; font: inherit; font-weight: 600; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #38bdf8; color: #08203a; }
      .secondary { background: transparent; color: #f8fafc; border-color: rgba(255,255,255,0.35); }
      svg { width: 18px; height: 18px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Esta página não carregou</h1>
      <p>Algo deu errado ou a internet caiu. Você pode voltar para o início e continuar usando a mesa.</p>
      <div class="actions">
        <a class="primary" href="/">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.8V21h14V9.8" /></svg>
          Voltar para o início
        </a>
        <button class="secondary" onclick="location.reload()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /></svg>
          Tentar de novo
        </button>
      </div>
    </div>
  </body>
</html>`;
}
