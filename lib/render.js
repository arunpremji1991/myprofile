const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'site-template.html');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonForScriptTag(str) {
  // Safe to drop into a JSON string value inside an inline <script> block.
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/</g, '\\u003C')
    .replace(/\r?\n/g, ' ');
}

function renderSite({ siteUrl, canonicalPath, metaTitle, metaDescription, heroEyebrow, heroRoles }) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const canonicalUrl = new URL(canonicalPath || '/', siteUrl).toString();
  const ogImageUrl = new URL('/arun-photo-web.jpg', siteUrl).toString();

  const rolesJson = JSON.stringify(
    Array.isArray(heroRoles) && heroRoles.length ? heroRoles : ['Digital Marketing Leader']
  );

  return template
    .split('{{META_TITLE}}').join(escapeHtml(metaTitle))
    .split('{{META_DESCRIPTION}}').join(escapeHtml(metaDescription))
    .split('{{META_DESCRIPTION_JSON}}').join(escapeJsonForScriptTag(metaDescription))
    .split('{{CANONICAL_URL}}').join(canonicalUrl)
    .split('{{OG_IMAGE_URL}}').join(ogImageUrl)
    .split('{{HERO_EYEBROW}}').join(escapeHtml(heroEyebrow))
    .split('{{HERO_ROLES_JSON}}').join(rolesJson);
}

module.exports = { renderSite, escapeHtml };
