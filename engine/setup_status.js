#!/usr/bin/env node
/**
 * Onboarding status check.
 *
 * Reports which setup steps are done and what the agent must ask the user for
 * next. Agents run it at the start of every session (Claude Code does so
 * automatically through the SessionStart hook in .claude/settings.json) and
 * must finish onboarding before doing any resume work.
 *
 * Usage:
 *   node engine/setup_status.js          # human-readable checklist; exit 1 if incomplete
 *   node engine/setup_status.js --hook   # same text, always exit 0 (session-start context)
 */

const fs = require('fs');
const path = require('path');
const { profileDir } = require('./profile');

const DOC_EXT = /\.(pdf|docx?|rtf|txt|md|pages|odt|html?)$/i;
const EXAMPLE_EMAIL = /@example\.(com|org)$/i;

function check() {
  const steps = [];
  const step = (done, label, ask) => steps.push({ done, label, ask });

  let dir;
  try {
    dir = profileDir();
  } catch {
    step(false, 'Profile folder exists',
      'Run `npm run init` to create profile/ (or ask where the user wants it and set RESUME_PROFILE_DIR).');
    return { steps, dir: null };
  }
  step(true, `Profile folder exists (${dir})`);

  const raw = JSON.parse(fs.readFileSync(path.join(dir, 'profile.json'), 'utf8'));
  const onboarding = raw.onboarding || {};
  const contact = raw.contact || {};

  const intakeDir = path.join(dir, 'intake');
  const docs = fs.existsSync(intakeDir)
    ? fs.readdirSync(intakeDir).filter((f) => DOC_EXT.test(f) && !/^readme\b/i.test(f))
    : [];
  step(docs.length > 0, `Source documents in intake/ (${docs.length} found)`,
    `Ask the user to add their past resumes and supporting documents to ${intakeDir}. ` +
    'See "Step 1" in docs/ONBOARDING.md for the full list.');
  step(Boolean(onboarding.intakeComplete), 'User confirmed every document is added',
    'List the documents found, name what is still missing from the checklist, and ask whether anything else ' +
    'should be added. Set onboarding.intakeComplete to true only when the user says that is everything.');

  const missing = ['name'].filter((k) => !raw[k]).concat(['email', 'phone'].filter((k) => !contact[k]));
  const isExample = EXAMPLE_EMAIL.test(contact.email || '');
  step(missing.length === 0 && !isExample, 'Identity and contact details in profile.json',
    missing.length ? `Fill ${missing.join(', ')} from the intake documents, then confirm them with the user.`
      : 'profile.json still holds the example candidate; replace it with the user\'s details.');

  const storePath = path.resolve(dir, raw.dataStore || 'data-store.md');
  const store = fs.existsSync(storePath) ? fs.readFileSync(storePath, 'utf8') : '';
  step(store.trim().length > 500, 'Data store built from the intake documents',
    `Build ${storePath} following "Step 3" in docs/ONBOARDING.md.`);
  step(Boolean(onboarding.dataStoreReviewed), 'User reviewed the data store and resolved conflicts',
    'Walk the user through conflicts and gaps ("Step 4"), then set onboarding.dataStoreReviewed to true.');

  const prefPath = path.resolve(dir, raw.preferences || 'preferences.md');
  step(fs.existsSync(prefPath) && Boolean(onboarding.preferencesReviewed), 'Editorial preferences captured',
    `Run the preferences interview ("Step 5"), write ${prefPath}, then set onboarding.preferencesReviewed to true.`);

  return { steps, dir };
}

const { steps } = check();
const next = steps.find((s) => !s.done);
const lines = ['Editorial resume onboarding status:'];
steps.forEach((s) => lines.push(`  [${s.done ? 'x' : ' '}] ${s.label}`));
if (next) {
  lines.push('', 'ONBOARDING INCOMPLETE. Do not start resume work yet.');
  lines.push(`Next: ${next.ask}`);
  lines.push('Follow docs/ONBOARDING.md and greet the user with the walkthrough before anything else.');
} else {
  lines.push('', 'Onboarding complete. Resume work may begin; follow AGENTS.md.');
}
process.stdout.write(lines.join('\n') + '\n');
if (!process.argv.includes('--hook') && next) process.exit(1);
