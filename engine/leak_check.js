#!/usr/bin/env node
/**
 * Personal-data leak guard.
 *
 * Builds a deny list from the active profile (name, each name part, contact
 * details, and profile.json "leakGuard.terms") and fails when any of them
 * appears in files that would be committed. It also refuses anything under
 * profile/ and binary documents outside docs/images/, since a rendered resume
 * carries personal data in a form a text scan cannot read.
 *
 * Usage:
 *   node engine/leak_check.js --staged   # pre-commit hook: staged content only
 *   node engine/leak_check.js --all      # every tracked or committable file
 *
 * Without a local profile there is nothing personal to look for, so the check
 * passes with a notice. That is the normal state for anyone else's clone.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { loadProfile, REPO_ROOT } = require('./profile');

const BINARY_DOC = /\.(pdf|png|jpe?g|gif|webp|docx?|pages|key|pptx?)$/i;
const BINARY_ALLOWED_DIR = 'docs/images/';

const git = (...args) => execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function denyPatterns(profile) {
  const patterns = [];
  const add = (label, source) => patterns.push({ label, regex: new RegExp(source, 'i') });
  const word = (term) => {
    const trimmed = term.trim();
    if (trimmed.length < 3) return;
    const body = escapeRegex(trimmed);
    add(trimmed, /^\w/.test(trimmed) && /\w$/.test(trimmed) ? `\\b${body}\\b` : body);
  };

  word(profile.name);
  profile.name.split(/\s+/).forEach(word);
  const { contact } = profile;
  [contact.email, contact.linkedin, contact.portfolio, contact.location].filter(Boolean).forEach(word);
  if (contact.email) word(contact.email.split('@')[0]);
  const digits = (contact.phone || '').replace(/\D/g, '').slice(-10);
  if (digits.length >= 7) add(`phone ${contact.phone}`, digits.split('').join('\\D{0,3}'));
  profile.leakTerms.forEach(word);
  return patterns;
}

function candidateFiles(mode) {
  if (mode === '--staged') {
    return git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z').split('\0').filter(Boolean)
      .map((file) => ({ file, read: () => execFileSync('git', ['show', `:${file}`], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 }) }));
  }
  return git('ls-files', '-co', '--exclude-standard', '-z').split('\0').filter(Boolean)
    .filter((file) => fs.existsSync(path.join(REPO_ROOT, file)))
    .map((file) => ({ file, read: () => fs.readFileSync(path.join(REPO_ROOT, file)) }));
}

const mode = process.argv[2];
if (mode !== '--staged' && mode !== '--all') {
  console.error('Usage: node engine/leak_check.js --staged | --all');
  process.exit(1);
}

let profile = null;
try {
  profile = loadProfile();
} catch {
  console.log('leak-check: no local profile, so there are no secrets to guard. Lucky you.');
}

const patterns = profile ? denyPatterns(profile) : [];
const findings = [];

for (const { file, read } of candidateFiles(mode)) {
  if (file === 'profile' || file.startsWith('profile/')) {
    findings.push(`${file}: files under profile/ are private and must never be committed`);
    continue;
  }
  if (BINARY_DOC.test(file) && !file.startsWith(BINARY_ALLOWED_DIR)) {
    findings.push(`${file}: rendered documents and images belong in your profile, not the repo (allowed only under ${BINARY_ALLOWED_DIR})`);
    continue;
  }
  if (!patterns.length) continue;
  const buffer = read();
  if (buffer.includes(0)) continue;
  buffer.toString('utf8').split('\n').forEach((line, index) => {
    for (const { label, regex } of patterns) {
      if (regex.test(line)) findings.push(`${file}:${index + 1}: contains "${label}"`);
    }
  });
}

if (findings.length) {
  console.error('leak-check: nope. Your personal details tried to sneak into the repo. Nothing was committed.\n');
  findings.forEach((finding) => console.error(`  ${finding}`));
  console.error('\nMove it into your profile folder, where secrets belong, or swap in example data.');
  process.exit(1);
}
console.log(`leak-check: clean. Nobody gets your phone number today (${patterns.length} personal patterns checked).`);
