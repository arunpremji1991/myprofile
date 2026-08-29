// Small server-rendered admin UI. Kept separate from the public site template
// since it's an internal tool, but styled to match the same dark/premium look.

const { escapeHtml } = require('./render');

function layout({ title, body, showNav = true }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)} · arunpremji.com admin</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = { theme: { extend: { colors: {
    bg:'#050505', card:'#111111', eblue:'#2F6FFF', epurple:'#8B5CF6', ecyan:'#22D3EE', muted:'#9CA3AF'
  } } } }
</script>
<style>
  body{ background:#050505; color:#F5F5F7; font-family:Inter,system-ui,sans-serif; }
  .glass{ background:rgba(17,17,17,.7); border:1px solid rgba(255,255,255,.08); backdrop-filter:blur(12px); }
  .grad-text{ background:linear-gradient(100deg,#2F6FFF,#8B5CF6,#22D3EE); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .btn{ background:linear-gradient(100deg,#2F6FFF,#8B5CF6); transition:transform .2s; }
  .btn:hover{ transform:translateY(-2px); }
  input, textarea{ background:#0c0c0c; border:1px solid rgba(255,255,255,.12); color:#fff; }
  input:focus, textarea:focus{ outline:2px solid #8B5CF6; border-color:transparent; }
  label{ color:#9CA3AF; }
</style>
</head>
<body class="min-h-screen">
${showNav ? `
<header class="border-b border-white/10">
  <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="/admin" class="font-semibold text-lg tracking-tight">AP<span class="grad-text">.</span> <span class="text-sm text-muted font-normal">admin</span></a>
    <nav class="flex items-center gap-5 text-sm text-muted">
      <a href="/admin" class="hover:text-white">Pages</a>
      <a href="/" target="_blank" class="hover:text-white">View site ↗</a>
      <a href="/admin/logout" class="hover:text-white">Log out</a>
    </nav>
  </div>
</header>` : ''}
<main class="max-w-5xl mx-auto px-6 py-12">
${body}
</main>
</body>
</html>`;
}

function loginPage({ error, next } = {}) {
  return layout({
    title: 'Log in',
    showNav: false,
    body: `
    <div class="max-w-sm mx-auto mt-16">
      <div class="text-center mb-8">
        <div class="font-semibold text-2xl tracking-tight mb-1">AP<span class="grad-text">.</span></div>
        <div class="text-sm text-muted">Sign in to manage location pages</div>
      </div>
      <form method="POST" action="/login" class="glass rounded-2xl p-6 space-y-4">
        <input type="hidden" name="next" value="${escapeHtml(next || '')}">
        ${error ? `<div class="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">${escapeHtml(error)}</div>` : ''}
        <div>
          <label class="block text-xs mb-1.5">Username</label>
          <input name="username" required class="w-full rounded-lg px-3 py-2.5 text-sm" autofocus>
        </div>
        <div>
          <label class="block text-xs mb-1.5">Password</label>
          <input type="password" name="password" required class="w-full rounded-lg px-3 py-2.5 text-sm">
        </div>
        <button class="btn w-full rounded-lg py-2.5 text-sm font-medium text-white mt-2">Log in</button>
      </form>
    </div>`,
  });
}

function dashboardPage({ pages, flash, siteUrl }) {
  const rows = pages.length
    ? pages
        .map(
          (p) => `
        <tr class="border-t border-white/8">
          <td class="py-3 pr-4">
            <div class="font-medium">${escapeHtml(p.metaTitle || p.slug)}</div>
            <a href="${escapeHtml(siteUrl.replace(/\/$/, ''))}/${escapeHtml(p.slug)}" target="_blank" class="text-xs text-ecyan/90 hover:underline">/${escapeHtml(p.slug)} ↗</a>
          </td>
          <td class="py-3 pr-4 text-sm text-muted">${escapeHtml(p.heroEyebrow || '—')}</td>
          <td class="py-3 pr-4 text-sm text-muted">${(p.heroRoles || []).map(escapeHtml).join(', ')}</td>
          <td class="py-3 pl-4 text-right whitespace-nowrap">
            <a href="/admin/pages/${p.id}/edit" class="text-sm text-eblue hover:underline mr-4">Edit</a>
            <form method="POST" action="/admin/pages/${p.id}/delete" class="inline" onsubmit="return confirm('Delete this page? This cannot be undone.');">
              <button class="text-sm text-red-400 hover:underline">Delete</button>
            </form>
          </td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="4" class="py-10 text-center text-muted text-sm">No location pages yet. Create your first one below.</td></tr>`;

  return layout({
    title: 'Location pages',
    body: `
    ${flash ? `<div class="mb-6 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2.5">${escapeHtml(flash)}</div>` : ''}
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-semibold mb-1">Location pages</h1>
        <p class="text-sm text-muted">SEO landing pages like <span class="font-mono text-white/80">/digital_marketing_expert_in_dubai</span>. Not linked in the homepage menu — share the URL directly or list it in the sitemap.</p>
      </div>
      <a href="/admin/pages/new" class="btn rounded-full px-5 py-2.5 text-sm font-medium text-white whitespace-nowrap">+ New page</a>
    </div>
    <div class="glass rounded-2xl overflow-hidden">
      <table class="w-full text-left">
        <thead>
          <tr class="text-xs text-muted uppercase tracking-wide">
            <th class="py-3 pl-5 pr-4 font-medium">Page</th>
            <th class="py-3 pr-4 font-medium">Title tag (hero)</th>
            <th class="py-3 pr-4 font-medium">Hero roles</th>
            <th class="py-3 pr-5 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>${rows.replace(/<td class="py-3 pr-4">/, '<td class="py-3 pl-5 pr-4">')}</tbody>
      </table>
    </div>
    <div class="mt-8 text-sm text-muted">
      Sitemap for search engines: <a href="/sitemap.xml" target="_blank" class="text-ecyan/90 hover:underline">/sitemap.xml</a>
    </div>`,
  });
}

function pageForm({ mode, page, error, siteUrl }) {
  const isEdit = mode === 'edit';
  const p = page || { slug: '', metaTitle: '', metaDescription: '', heroEyebrow: '', heroRoles: [] };
  const rolesText = (p.heroRoles || []).join(', ');

  return layout({
    title: isEdit ? 'Edit page' : 'New page',
    body: `
    <a href="/admin" class="text-sm text-muted hover:text-white">← Back to all pages</a>
    <h1 class="text-2xl font-semibold mt-3 mb-1">${isEdit ? 'Edit location page' : 'Create a new location page'}</h1>
    <p class="text-sm text-muted mb-8">This page will be live at <span class="font-mono text-white/80">${escapeHtml(siteUrl.replace(/\/$/, ''))}/&lt;slug&gt;</span> as soon as you save. It won't appear in the homepage navigation.</p>

    ${error ? `<div class="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5">${escapeHtml(error)}</div>` : ''}

    <form method="POST" action="${isEdit ? `/admin/pages/${p.id}` : '/admin/pages'}" class="glass rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl">
      <div>
        <label class="block text-xs mb-1.5">URL slug (link)</label>
        <div class="flex items-center rounded-lg overflow-hidden border border-white/12 focus-within:outline focus-within:outline-2 focus-within:outline-epurple">
          <span class="px-3 py-2.5 text-sm text-muted bg-white/5 whitespace-nowrap">${escapeHtml(siteUrl.replace(/\/$/, ''))}/</span>
          <input name="slug" required value="${escapeHtml(p.slug)}" placeholder="digital_marketing_expert_in_dubai" class="w-full px-3 py-2.5 text-sm border-0 focus:outline-none">
        </div>
        <p class="text-xs text-muted mt-1.5">Letters, numbers and underscores only — spaces are converted to underscores automatically.</p>
      </div>

      <div>
        <label class="block text-xs mb-1.5">Meta title (browser tab / Google search title)</label>
        <input name="metaTitle" required value="${escapeHtml(p.metaTitle)}" placeholder="Digital Marketing Expert in Dubai | Arunraj Premji" class="w-full rounded-lg px-3 py-2.5 text-sm">
      </div>

      <div>
        <label class="block text-xs mb-1.5">Meta description (Google search snippet)</label>
        <textarea name="metaDescription" required rows="3" placeholder="Arunraj Premji is a Digital Marketing Expert in Dubai helping businesses grow with Google Ads, Meta Ads, SEO and performance marketing." class="w-full rounded-lg px-3 py-2.5 text-sm">${escapeHtml(p.metaDescription)}</textarea>
      </div>

      <div>
        <label class="block text-xs mb-1.5">Title tag (the small line at the top of the page, above the name)</label>
        <input name="heroEyebrow" required value="${escapeHtml(p.heroEyebrow)}" placeholder="DIGITAL MARKETING EXPERT IN DUBAI" class="w-full rounded-lg px-3 py-2.5 text-sm">
      </div>

      <div>
        <label class="block text-xs mb-1.5">Heading below the name (one or more, comma-separated — they rotate automatically)</label>
        <input name="heroRoles" required value="${escapeHtml(rolesText)}" placeholder="Digital Marketing Expert in Dubai, Full Stack Digital Marketer" class="w-full rounded-lg px-3 py-2.5 text-sm">
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button class="btn rounded-full px-6 py-2.5 text-sm font-medium text-white">${isEdit ? 'Save changes' : 'Create page'}</button>
        <a href="/admin" class="text-sm text-muted hover:text-white">Cancel</a>
      </div>
    </form>`,
  });
}

module.exports = { loginPage, dashboardPage, pageForm };
