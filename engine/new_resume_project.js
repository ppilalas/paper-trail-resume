const fs = require('fs');
const path = require('path');
const { loadProfile, REPO_ROOT } = require('./profile');

function option(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) throw new Error(`Required option: ${name}`);
  return process.argv[index + 1].trim();
}

function filenamePart(value) {
  return value
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const company = option('--company');
const role = option('--role');
const date = option('--date');
const dryRun = process.argv.includes('--dry-run');

if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Date must use YYYY-MM-DD');

const profile = loadProfile();
const companyPart = filenamePart(company);
const rolePart = filenamePart(role);
if (!companyPart) throw new Error('Company must contain at least one letter or number');
if (!rolePart) throw new Error('Role must contain at least one letter or number');
const projectPart = `${companyPart}-${rolePart}`;
const sourcePath = path.join(profile.workspaceDir, `${projectPart}.html`);
const briefDir = path.join(profile.workspaceDir, 'briefs');
const briefPath = path.join(briefDir, `${projectPart}-${date}.md`);
const pdfPath = path.join(profile.outputDir, `${profile.filenamePrefix}-${projectPart}-${date}.pdf`);
const starterPath = profile.starter;
const briefTemplatePath = path.join(REPO_ROOT, 'templates', 'PROJECT-BRIEF-TEMPLATE.md');

if (!fs.existsSync(starterPath)) throw new Error(`Production starter HTML is missing: ${starterPath}`);
if (!fs.existsSync(briefTemplatePath)) throw new Error(`Brief template is missing: ${briefTemplatePath}`);
if (fs.existsSync(sourcePath)) throw new Error(`Refusing to overwrite existing HTML: ${sourcePath}`);
if (fs.existsSync(briefPath)) throw new Error(`Refusing to overwrite existing brief: ${briefPath}`);
if (fs.existsSync(pdfPath)) throw new Error(`A final PDF already uses this project identity: ${pdfPath}`);

// Identity and contact tokens come from the profile, so the starter template
// itself never carries anyone's personal details.
const tokens = {
  NAME: profile.name,
  NAME_FIRST: profile.nameFirst,
  NAME_REST: profile.nameRest,
  LOCATION: profile.contact.location,
  PHONE: profile.contact.phone,
  PHONE_HREF: profile.contact.phoneHref,
  EMAIL: profile.contact.email,
  LINKEDIN: profile.contact.linkedin,
  LINKEDIN_HREF: profile.contact.linkedinHref,
  PORTFOLIO: profile.contact.portfolio,
  PORTFOLIO_HREF: profile.contact.portfolioHref,
  COMPANY: company,
  ROLE: role,
};
const html = fs.readFileSync(starterPath, 'utf8')
  .replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => (key in tokens ? escapeHtml(tokens[key]) : match));

const brief = fs.readFileSync(briefTemplatePath, 'utf8')
  .replaceAll('{{COMPANY}}', company)
  .replaceAll('{{ROLE}}', role)
  .replaceAll('{{DATE}}', date)
  .replaceAll('{{HTML_PATH}}', sourcePath)
  .replaceAll('{{PDF_PATH}}', pdfPath);

if (!dryRun) {
  fs.mkdirSync(briefDir, { recursive: true });
  fs.writeFileSync(sourcePath, html, { flag: 'wx' });
  fs.writeFileSync(briefPath, brief, { flag: 'wx' });
}

const renderCommand = `npm run render -- --input '${sourcePath}' --output '${pdfPath}'`;

process.stdout.write([
  dryRun ? 'DRY RUN' : 'CREATED',
  `Profile: ${profile.dir}`,
  `HTML: ${sourcePath}`,
  `Brief: ${briefPath}`,
  `PDF: ${pdfPath}`,
  `Starter: ${starterPath}`,
  `Render: ${renderCommand}`,
  '',
].join('\n'));
