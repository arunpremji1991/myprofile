require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const { renderSite } = require('./lib/render');
const defaults = require('./lib/defaults');
const pagesStore = require('./lib/pages');
const { verifyLogin, requireAuth, ensureAdmin } = require('./lib/auth');
const views = require('./lib/views');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = (process.env.SITE_URL || 'https://www.arunpremji.com').replace(/\/+$/, '') + '/';

ensureAdmin(); // seeds the admin account from .env on first run

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 12, // 12 hours
      // 'secure' cookies require HTTPS. Turn this on once the site is served over https://
      secure: process.env.COOKIE_SECURE === 'true',
    },
  })
);

// Static assets (photo, resume, brand logos) — served from the site root so
// both / and /any-location-page can reference them with an absolute path.
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
app.get('/login', (req, res) => {
  res.send(views.loginPage({ next: req.query.next }));
});

app.post('/login', (req, res) => {
  const { username, password, next } = req.body;
  if (verifyLogin(username, password)) {
    req.session.isAdmin = true;
    req.session.username = username;
    return res.redirect(next && next.startsWith('/admin') ? next : '/admin');
  }
  res.status(401).send(views.loginPage({ error: 'Incorrect username or password.', next }));
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ---------------------------------------------------------------------------
// Admin — location page manager
// ---------------------------------------------------------------------------
app.get('/admin', requireAuth, (req, res) => {
  const pages = pagesStore.getAll().sort((a, b) => a.slug.localeCompare(b.slug));
  res.send(views.dashboardPage({ pages, flash: req.query.saved ? 'Saved.' : req.query.deleted ? 'Page deleted.' : null, siteUrl: SITE_URL }));
});

app.get('/admin/pages/new', requireAuth, (req, res) => {
  res.send(views.pageForm({ mode: 'new', siteUrl: SITE_URL }));
});

app.post('/admin/pages', requireAuth, (req, res) => {
  try {
    const page = pagesStore.create(req.body);
    res.redirect('/admin?saved=1');
  } catch (err) {
    res.status(400).send(views.pageForm({ mode: 'new', page: req.body, error: err.message, siteUrl: SITE_URL }));
  }
});

app.get('/admin/pages/:id/edit', requireAuth, (req, res) => {
  const page = pagesStore.getById(req.params.id);
  if (!page) return res.status(404).send('Page not found.');
  res.send(views.pageForm({ mode: 'edit', page, siteUrl: SITE_URL }));
});

app.post('/admin/pages/:id', requireAuth, (req, res) => {
  try {
    pagesStore.update(req.params.id, req.body);
    res.redirect('/admin?saved=1');
  } catch (err) {
    const page = { ...req.body, id: req.params.id };
    res.status(400).send(views.pageForm({ mode: 'edit', page, error: err.message, siteUrl: SITE_URL }));
  }
});

app.post('/admin/pages/:id/delete', requireAuth, (req, res) => {
  pagesStore.remove(req.params.id);
  res.redirect('/admin?deleted=1');
});

// ---------------------------------------------------------------------------
// SEO helpers
// ---------------------------------------------------------------------------
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\nSitemap: ${SITE_URL}sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const pages = pagesStore.getAll();
  const urls = [
    `  <url><loc>${SITE_URL}</loc></url>`,
    ...pages.map((p) => `  <url><loc>${new URL(p.slug, SITE_URL).toString()}</loc></url>`),
  ].join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

// ---------------------------------------------------------------------------
// Public site
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.send(
    renderSite({
      siteUrl: SITE_URL,
      canonicalPath: defaults.canonicalPath,
      metaTitle: defaults.metaTitle,
      metaDescription: defaults.metaDescription,
      heroEyebrow: defaults.heroEyebrow,
      heroRoles: defaults.heroRoles,
    })
  );
});

// Any other path: look it up as a location page. Must stay last.
app.get('/:slug', (req, res, next) => {
  const page = pagesStore.getBySlug(req.params.slug);
  if (!page) return next(); // fall through to 404

  res.send(
    renderSite({
      siteUrl: SITE_URL,
      canonicalPath: '/' + page.slug,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      heroEyebrow: page.heroEyebrow,
      heroRoles: page.heroRoles,
    })
  );
});

app.use((req, res) => {
  res.status(404).send('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Page not found</title></head><body style="background:#050505;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div><h1 style="font-size:1.5rem;">404 — Page not found</h1><p><a href="/" style="color:#8B5CF6;">Back to homepage</a></p></div></body></html>');
});

app.listen(PORT, () => {
  console.log(`arunpremji.com server running at http://localhost:${PORT}`);
});
