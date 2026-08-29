const bcrypt = require('bcryptjs');
const { readJson, writeJson } = require('./store');

const FILE = 'admin.json';

function ensureAdmin() {
  let admin = readJson(FILE, null);
  if (admin && admin.username && admin.passwordHash) return admin;

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'changeme';
  const passwordHash = bcrypt.hashSync(password, 10);
  admin = { username, passwordHash };
  writeJson(FILE, admin);
  console.log(`Created admin account "${username}" from .env. You can change the password later by editing data/admin.json (delete it and restart to reseed from .env, or use bcrypt to generate a new hash).`);
  return admin;
}

function verifyLogin(username, password) {
  const admin = ensureAdmin();
  if (username !== admin.username) return false;
  return bcrypt.compareSync(password, admin.passwordHash);
}

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
}

module.exports = { ensureAdmin, verifyLogin, requireAuth };
