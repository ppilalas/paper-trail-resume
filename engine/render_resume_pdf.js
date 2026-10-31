const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { checkResumeLayout } = require('./check_resume_layout');

function option(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) throw new Error(`Required option: ${name}`);
  if (!process.argv[index + 1]) throw new Error(`Missing value for ${name}`);
  return process.argv[index + 1];
}

const input = path.resolve(option('--input'));
const output = path.resolve(option('--output'));

if (!fs.existsSync(input)) throw new Error(`Input HTML does not exist: ${input}`);
if (path.extname(input).toLowerCase() !== '.html') throw new Error('Input must be an HTML file');
if (path.extname(output).toLowerCase() !== '.pdf') throw new Error('Output must be a PDF file');
fs.mkdirSync(path.dirname(output), { recursive: true });

(async () => {
  // Prefer the installed Google Chrome; CHROME_PATH points at another build,
  // and Playwright's own Chromium is the fallback.
  const browser = process.env.CHROME_PATH
    ? await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH })
    : await chromium.launch({ headless: true, channel: 'chrome' })
      .catch(() => chromium.launch({ headless: true }));
  const page = await browser.newPage({ viewport: { width: 1224, height: 1584 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(input).href, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(async () => { await document.fonts.ready; });

  const overflow = await page.evaluate(() => [...document.querySelectorAll('.page')].map((node, index) => ({
    page: index + 1,
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  })));
  if (overflow.length !== 2) {
    throw new Error(`Resume must contain exactly two .page elements; found ${overflow.length}`);
  }
  for (const check of overflow) {
    if (check.scrollHeight > check.clientHeight || check.scrollWidth > check.clientWidth) {
      throw new Error(`Layout overflow on page ${check.page}: ${JSON.stringify(check)}`);
    }
  }

  const layout = await checkResumeLayout(page);
  process.stdout.write('Layout QA passed: ' + JSON.stringify(layout) + '\n');

  await page.pdf({
    path: output,
    format: 'Letter',
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
    outline: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await browser.close();
  process.stdout.write(output + '\n');
})().catch((error) => {
  process.stderr.write(error.stack + '\n');
  process.exit(1);
});
