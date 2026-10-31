/**
 * Profile loader for Paper Trail.
 *
 * Everything personal (name, contact details, evidence, preferences, and the
 * folders where resumes are written) lives in a profile directory that is
 * never committed. The engine finds it in this order:
 *
 *   1. the RESUME_PROFILE_DIR environment variable;
 *   2. ./profile at the repository root (gitignored).
 *
 * Copy profile.example/ to profile/ to get started. Paths inside
 * profile.json are resolved relative to the profile directory.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

function profileDir() {
  const fromEnv = process.env.RESUME_PROFILE_DIR;
  if (fromEnv) {
    const dir = path.resolve(fromEnv);
    if (!fs.existsSync(path.join(dir, 'profile.json'))) {
      throw new Error(`RESUME_PROFILE_DIR has no profile.json: ${dir}`);
    }
    return fs.realpathSync(dir);
  }
  const local = path.join(REPO_ROOT, 'profile');
  // Resolve a symlinked profile so its relative paths follow the real folder.
  if (fs.existsSync(path.join(local, 'profile.json'))) return fs.realpathSync(local);
  throw new Error(
    'No profile found. Copy profile.example/ to profile/ (gitignored) and edit profile.json, ' +
    'or set RESUME_PROFILE_DIR to a folder that contains profile.json.'
  );
}

function hrefFor(value) {
  if (!value) return '';
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}

function loadProfile() {
  const dir = profileDir();
  const raw = JSON.parse(fs.readFileSync(path.join(dir, 'profile.json'), 'utf8'));
  const resolve = (value, fallback) => path.resolve(dir, value || fallback);

  if (!raw.name) throw new Error('profile.json needs a "name"');
  const contact = raw.contact || {};
  const nameParts = raw.name.trim().split(/\s+/);
  // Ten digits is read as a North American number; set contact.phoneHref otherwise.
  const phoneDigits = (contact.phone || '').replace(/\D/g, '');
  const phoneHref = contact.phoneHref
    || (phoneDigits ? `tel:+${phoneDigits.length === 10 ? '1' : ''}${phoneDigits}` : '');

  return {
    dir,
    name: raw.name.trim(),
    nameFirst: nameParts[0],
    nameRest: nameParts.slice(1).join(' '),
    filenamePrefix: raw.filenamePrefix || `${nameParts.join('-')}-Resume`,
    contact: {
      location: contact.location || '',
      phone: contact.phone || '',
      phoneHref,
      email: contact.email || '',
      linkedin: contact.linkedin || '',
      linkedinHref: hrefFor(contact.linkedin),
      portfolio: contact.portfolio || '',
      portfolioHref: hrefFor(contact.portfolio),
    },
    requiredText: raw.requiredText || [],
    minLinks: raw.minLinks ?? 4,
    dataStore: resolve(raw.dataStore, 'data-store.md'),
    preferences: resolve(raw.preferences, 'preferences.md'),
    workspaceDir: resolve(raw.workspaceDir, 'resumes'),
    outputDir: resolve(raw.outputDir, 'output'),
    starter: resolve(raw.starter, path.join(REPO_ROOT, 'templates', 'starter.html')),
    leakTerms: (raw.leakGuard && raw.leakGuard.terms) || [],
  };
}

module.exports = { loadProfile, profileDir, REPO_ROOT };

if (require.main === module) {
  process.stdout.write(JSON.stringify(loadProfile(), null, 2) + '\n');
}
