const { readJson, writeJson } = require('./store');

const FILE = 'pages.json';

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getAll() {
  return readJson(FILE, []);
}

function getBySlug(slug) {
  const pages = getAll();
  return pages.find((p) => p.slug === slug) || null;
}

function getById(id) {
  const pages = getAll();
  return pages.find((p) => String(p.id) === String(id)) || null;
}

function nextId(pages) {
  return pages.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
}

function parseRoles(rolesInput) {
  return String(rolesInput || '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
}

function create(fields) {
  const pages = getAll();
  const slug = slugify(fields.slug);
  if (!slug) throw new Error('Slug is required.');
  if (pages.some((p) => p.slug === slug)) {
    throw new Error(`A page with the slug "${slug}" already exists.`);
  }
  const roles = parseRoles(fields.heroRoles);
  if (roles.length === 0) throw new Error('At least one hero role/title is required.');

  const page = {
    id: nextId(pages),
    slug,
    metaTitle: (fields.metaTitle || '').trim(),
    metaDescription: (fields.metaDescription || '').trim(),
    heroEyebrow: (fields.heroEyebrow || '').trim(),
    heroRoles: roles,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  pages.push(page);
  writeJson(FILE, pages);
  return page;
}

function update(id, fields) {
  const pages = getAll();
  const idx = pages.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) throw new Error('Page not found.');

  const slug = slugify(fields.slug);
  if (!slug) throw new Error('Slug is required.');
  if (pages.some((p) => p.slug === slug && String(p.id) !== String(id))) {
    throw new Error(`Another page already uses the slug "${slug}".`);
  }
  const roles = parseRoles(fields.heroRoles);
  if (roles.length === 0) throw new Error('At least one hero role/title is required.');

  pages[idx] = {
    ...pages[idx],
    slug,
    metaTitle: (fields.metaTitle || '').trim(),
    metaDescription: (fields.metaDescription || '').trim(),
    heroEyebrow: (fields.heroEyebrow || '').trim(),
    heroRoles: roles,
    updatedAt: new Date().toISOString(),
  };
  writeJson(FILE, pages);
  return pages[idx];
}

function remove(id) {
  const pages = getAll();
  const next = pages.filter((p) => String(p.id) !== String(id));
  writeJson(FILE, next);
  return next.length !== pages.length;
}

module.exports = { getAll, getBySlug, getById, create, update, remove, slugify, parseRoles };
