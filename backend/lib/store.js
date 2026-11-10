// Tiny file-based JSON data store.
// Good enough for a single-admin site with a modest number of location pages.
// Writes are atomic (write to a temp file, then rename) so a crash mid-write
// can't corrupt the data file.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  ensureDataDir();
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return fallback;
  try {
    const raw = fs.readFileSync(p, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read ${file}, using fallback. Error:`, err.message);
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDataDir();
  const p = path.join(DATA_DIR, file);
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, p);
}

module.exports = { readJson, writeJson, DATA_DIR };
