#!/usr/bin/env node
/**
 * Creates an empty profile ready for onboarding at ./profile (gitignored).
 *
 * The session-start status check calls createProfile() on its own, so users
 * never have to pick a location. Running this by hand is only needed if that
 * check did not run.
 */

const fs = require('fs');
const path = require('path');
const { REPO_ROOT } = require('./profile');

const DEFAULT_PROFILE = path.join(REPO_ROOT, 'profile');

function createProfile(target = DEFAULT_PROFILE) {
  if (fs.existsSync(path.join(target, 'profile.json'))) return false;

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
  return true;
}

module.exports = { createProfile, DEFAULT_PROFILE };

if (require.main === module) {
  if (!createProfile()) {
    console.error(`A profile already lives at ${DEFAULT_PROFILE}. Not overwriting your whole career; nothing was changed.`);
    process.exit(1);
  }
  console.log(`Profile created at ${DEFAULT_PROFILE}. It's empty and judging you a little.`);
  console.log(`Next: feed it your old resumes in ${path.join(DEFAULT_PROFILE, 'intake')} (intake/README.md has the shopping list).`);
}
