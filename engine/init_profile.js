#!/usr/bin/env node
/**
 * Creates an empty profile ready for onboarding.
 *
 *   node engine/init_profile.js            # creates ./profile (gitignored)
 *   node engine/init_profile.js /some/dir  # creates the profile elsewhere;
 *                                          # then export RESUME_PROFILE_DIR=/some/dir
 */

const fs = require('fs');
const path = require('path');
const { REPO_ROOT } = require('./profile');

const target = path.resolve(process.argv[2] || path.join(REPO_ROOT, 'profile'));
if (fs.existsSync(path.join(target, 'profile.json'))) {
  console.error(`A profile already exists at ${target}. Nothing was changed.`);
  process.exit(1);
}

fs.mkdirSync(path.join(target, 'intake'), { recursive: true });
fs.mkdirSync(path.join(target, 'resumes', 'briefs'), { recursive: true });
fs.mkdirSync(path.join(target, 'output'), { recursive: true });

const profile = {
  name: '',
  filenamePrefix: '',
  contact: { location: '', phone: '', email: '', linkedin: '', portfolio: '' },
  requiredText: [],
  minLinks: 4,
  dataStore: 'data-store.md',
  preferences: 'preferences.md',
  workspaceDir: 'resumes',
  outputDir: 'output',
  starter: null,
  leakGuard: { terms: [] },
  onboarding: { intakeComplete: false, dataStoreReviewed: false, preferencesReviewed: false },
};
fs.writeFileSync(path.join(target, 'profile.json'), JSON.stringify(profile, null, 2) + '\n');
fs.copyFileSync(path.join(REPO_ROOT, 'templates', 'INTAKE-README.md'), path.join(target, 'intake', 'README.md'));

console.log(`Created ${target}`);
if (target !== path.join(REPO_ROOT, 'profile')) console.log(`Now run: export RESUME_PROFILE_DIR="${target}"`);
console.log(`Next: add your resumes and documents to ${path.join(target, 'intake')} (see intake/README.md).`);
