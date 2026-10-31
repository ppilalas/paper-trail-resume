# Editorial Resume

A designed, two-page resume system built from HTML and CSS and rendered to a
tagged, ATS-readable PDF. It is made to be driven by an AI coding agent (Claude
Code, Codex, and similar) working from one canonical file of verified career
evidence, with guardrails that keep every claim honest and every page clean.

- **Job Fit Preflight.** Before anything is written, the agent compares the
  job description with your evidence and recommends `Pursue`,
  `Pursue with material gaps`, or `Skip`.
- **Evidence-only content.** Every title, date, tool, and metric must come
  from your data store. Nothing is invented to mirror a posting.
- **Brand accent.** The accent color comes from the target company's brand,
  adjusted only in lightness until it is legible (`npm run accent`).
- **Layout QA gate.** The renderer refuses to write a PDF when text collides
  with the folio, spills past a page edge, or the document is not exactly two
  US Letter pages.
- **Validator.** Checks page count and size, tagging, links, metadata, file
  naming, and that your contact details survive text extraction.
- **ATS simulator.** A read-only agent (`.claude/agents/ats-simulator.md`)
  that reports how applicant tracking systems are likely to parse and rank
  the result.

## Your data stays out of git

The repository holds only the engine, templates, and docs. Everything
personal lives in a **profile** folder that is never committed:

```
profile/                 gitignored (or anywhere, via RESUME_PROFILE_DIR)
  profile.json           name, contact details, filename prefix, folders
  data-store.md          your verified career evidence
  preferences.md         your personal editorial rules
  resumes/               generated HTML sources and briefs/
  output/                final PDFs
```

`profile.example/` holds a complete profile for a fictional candidate, Jordan
Avery, so the system works straight after cloning.

A pre-commit hook (`engine/leak_check.js`) reads your profile and blocks any
commit that contains your name, email, phone, LinkedIn, portfolio, location,
or any extra terms you list under `leakGuard.terms` in `profile.json`, such as
past employers. It also blocks anything under `profile/` and rendered PDFs or
images. If [gitleaks](https://github.com/gitleaks/gitleaks) is installed, the
hook runs it too. Check the whole tree at any time with `npm run leak-check`.

## Setup

Requirements: Node 18+, Python 3.9+, Google Chrome (or Playwright's Chromium),
and `pdftoppm` from poppler for page images (`brew install poppler`).

```bash
git clone <this repo> editorial-resume && cd editorial-resume
npm install                       # also enables the pre-commit hook
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

Then open the folder with your AI agent (for example, run `claude` in it) and
say hello. The agent checks `npm run status` and walks you through setup
before it will write anything:

1. **Create your private profile.** It runs `npm run init`, which makes
   `profile/` (or a folder you choose, such as iCloud or Dropbox, used through
   `RESUME_PROFILE_DIR`).
2. **Add your documents to `profile/intake/`.** Required: your past resumes,
   as many versions as you have. Recommended: a LinkedIn profile PDF, cover
   letters, performance reviews, or a brag document. The agent lists what it
   found, points out gaps such as missing years, and keeps asking until you
   say that's everything. You can also paste text or drop files into the
   chat, and it saves them to `intake/` for you.
3. **It builds your data store.** It extracts text (`npm run extract`), fills
   `profile.json`, and writes `data-store.md` with every fact cited to its
   source document.
4. **You review it together.** It walks you through conflicts between resume
   versions and any metric whose scope is unclear.
5. **A short preferences interview** covers voice, what to leave out, and your
   favorite results, and the answers go into `preferences.md`.

After that, paste a job description. The agent follows `AGENTS.md`:
preflight, your decision, brief, brand accent, draft, render, validate, and
visual review.

Full script: [`docs/ONBOARDING.md`](docs/ONBOARDING.md). To see the system
working before you add anything, point it at the fictional example profile:

```bash
export RESUME_PROFILE_DIR="$PWD/profile.example"
npm run new -- --company 'Contoso' --role 'Head of Growth' --date '2026-07-28'
npm run render -- --input profile.example/resumes/Contoso-Head-of-Growth.html \
  --output profile.example/output/Jordan-Avery-Resume-Contoso-Head-of-Growth-2026-07-28.pdf
npm run validate -- profile.example/output/Jordan-Avery-Resume-Contoso-Head-of-Growth-2026-07-28.pdf \
  --expect 'Head of Growth' --qa-dir qa/contoso
```

## Commands

| Command | What it does |
|---|---|
| `npm run init` | Create an empty private profile |
| `npm run status` | Onboarding checklist and the next step |
| `npm run extract` | Convert intake documents to text for the agent |
| `npm run new` | Scaffold a resume and brief for one job |
| `npm run render` | Render HTML to PDF through the layout QA gate |
| `npm run validate` | Check the PDF and create page images for review |
| `npm run accent` | Turn brand colors into a legible accent |
| `npm run profile` | Show the resolved profile and paths |
| `npm run leak-check` | Scan the repo for your personal data |

With an AI agent, open the repository and ask for a resume for a job
description. The agent follows `AGENTS.md`: preflight, your decision, brief,
brand accent, draft, render, validate, visual review.

## Repository layout

| Path | Purpose |
|---|---|
| `AGENTS.md` | Rules every agent follows (`CLAUDE.md` imports it) |
| `docs/ONBOARDING.md` | First-run walkthrough the agent follows until setup is complete |
| `docs/WORKFLOW.md` | Step-by-step process, commands, and QA checklist |
| `docs/DESIGN-PRINCIPLES.md` | Creative standard, anti-slop and JD-mirroring reviews |
| `templates/starter.html` | Production starter with `{{TOKENS}}` filled from your profile |
| `templates/PROJECT-BRIEF-TEMPLATE.md` | Per-resume brief |
| `engine/` | Onboarding status, intake extraction, profile loader, scaffolder, renderer, layout gate, validator, accent resolver, leak check |
| `profile.example/` | Fictional sample profile |
| `.claude/agents/ats-simulator.md` | ATS simulation agent |

## License

MIT
