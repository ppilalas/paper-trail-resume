# Workflow

How a targeted resume moves from job description to delivered PDF. Commands
run from the repository root. Paths such as the data store, the resume
workspace, and the output folder come from the active profile; run
`npm run profile` to see them.

## What each piece does

- `templates/starter.html` is the production starter. `npm run new` copies it
  and fills the `{{NAME}}`, `{{EMAIL}}`, `{{ROLE}}` and other tokens from
  `profile.json`. A profile can point `starter` at its own HTML instead, for
  example a previous resume whose copy is closer to the next one.
- `engine/render_resume_pdf.js` renders a resume to a tagged PDF with
  Playwright and rejects page overflow.
- `engine/check_resume_layout.js` is the layout QA gate the renderer calls
  before writing the PDF. It fails when text overlaps the folio, when content
  spills past the page content box on any edge, or when fewer than 10px
  separate the last line of content from the folio, and prints the measured
  folio clearance for both pages on success.
- `engine/brand_accent.js` turns the target company's brand colors into a
  legible accent set. It does no network access; finding the colors is the
  research step described below.
- `engine/new_resume_project.js` creates a uniquely named HTML source and
  project brief without overwriting earlier work.
- `templates/PROJECT-BRIEF-TEMPLATE.md` turns the job description and verified
  evidence into an explicit content and art-direction plan.
- `engine/validate_resume_pdf.py` checks naming, location, page size, page
  count, tagging, links, metadata, the profile's identity and contact text, and
  creates the visual-QA page images.
- `engine/leak_check.js` keeps personal data out of commits.

The starter's styling baseline:

- simple conventional section headings;
- a dedicated section-heading rail with a clearly visible gutter before the
  content column;
- generous, consistent space between major editorial blocks;
- three separated proof panels with strong accent top rules;
- a focused four-item capability row;
- compact conventional line icons in the contact block, with accessible text
  labels retained semantically;
- proof and hierarchy preserved by trimming lower-priority content instead of
  shrinking type or compressing sections.

This is the default starting system, not a prohibition on thoughtful art
direction. Any departure should improve the target resume while preserving the
same clarity, prominence of evidence, and breathing room.

Do not treat prose from a job description, an old resume, or another targeted
resume as verified evidence unless it also appears in the data store.

## Create a targeted resume

1. Read this file, `AGENTS.md`, `docs/DESIGN-PRINCIPLES.md`, and the profile's
   preferences file completely.
2. Complete the mandatory Job Fit Preflight before creating any files:
   - compare the complete posting with the data store;
   - assess seniority, IC/manager fit, team and budget scale, company stage,
     domain, audience, tools, functional ownership, geography, and other hard
     requirements;
   - classify every meaningful gap as bridgeable, hard, or unknown;
   - ask focused follow-up questions that could verify evidence or eliminate
     the opportunity;
   - recommend `Pursue`, `Pursue with material gaps`, or `Skip`;
   - wait for the candidate's explicit proceed/skip decision.
3. If the candidate proceeds, create a new source and brief. The initializer
   refuses to overwrite an existing HTML source, brief, or final PDF:

   ```bash
   npm run new -- --company 'COMPANY' --role 'EXACT POSTED ROLE' --date 'YYYY-MM-DD'
   ```

   Add `--dry-run` to preview every path without creating files.
4. Reconfirm the data store and the complete job description.
5. Complete the generated brief (in the workspace's `briefs/` folder) before
   editing the generated HTML. It must identify verified evidence, content
   priorities, art direction, wording that risks mirroring the JD, and the
   preflight decision plus any accepted material gaps.
6. Find the target company's brand color and resolve the accent (required).

   Research, stopping when you have two or three candidate hex values you
   trust:

   - search for the company site and any brand, press, or media-kit page;
   - scrape the homepage for extracted colors (for example the firecrawl
     `branding` format); if that fails, look in the raw HTML for CSS custom
     properties, a `theme-color` meta tag, and repeated hex values, and use a
     full-page screenshot to confirm what the site actually looks like;
   - cross-check a brand-asset aggregator such as Brandfetch. Prefer the
     record for the hiring entity over a sibling product brand, and treat a
     color that appears in both records as corroborated.

   Then resolve the accent, passing candidates in the company's own order of
   importance:

   ```bash
   npm run accent -- "#PRIMARY" "#SECONDARY" "#TERTIARY"
   ```

   It returns the first candidate it can make work:

   ```json
   {
     "source": "#FF0079",
     "accent": "#e0006a",
     "adjusted": true,
     "accentSoft": "#f4d7e5",
     "panelFill": "#efedea",
     "paperContrast": 4.59,
     "inkContrast": 3.27
   }
   ```

   It enforces at least 4.5:1 against the paper so small bold accent text
   stays readable, requires enough separation from the ink that the accent
   still reads as an accent, and adjusts lightness only so the hue stays
   recognizably the company's. Set `--accent` and `--accent-soft` from the
   output, and set both `.metric` and `.side-card` backgrounds to `panelFill`.

   Scope is accent only. Paper, ink, body text, and muted text never change,
   and panels take the neutral fill rather than a brand tint. If the script
   rejects every candidate, keep the baseline accent and record the rejection
   output and the reason in the brief.
7. Keep the exact posted job title in the eyebrow or primary positioning line.
8. Write the profile in the candidate's voice as described in their
   preferences file: one memorable point of view, evidence as support rather
   than a wall of metrics, warm, direct, plainspoken language.
9. Select only verified roles, tools, dates, titles, and metrics. Keep all
   included roles in reverse chronological order, newest first, even when the
   history continues on page two or moves into `Additional Experience`.
10. Derive capability labels from the candidate's verified patterns of work,
    not from the employer's section headings or distinctive JD phrasing. Use
    the JD to prioritize evidence, then name the capability in the candidate's
    own language.
11. Use self-identifying section headings. For each major role, lead with what
    changed: a verified outcome, a durable operating change, or meaningful
    scope. Keep tools and activities subordinate to the result.
12. Keep two semantic `.page` elements.
13. Render, validate, and inspect both page images at full resolution.
14. Complete the brief's review and QA fields before delivery.

## Render

```bash
npm run render -- --input 'PATH/TO/RESUME.html' --output 'PATH/TO/OUTPUT.pdf'
```

The renderer uses the installed Google Chrome when it can find it, falls back
to Playwright's Chromium (`npx playwright install chromium`), and honors
`CHROME_PATH` for any other build. It waits for fonts, uses print CSS,
generates tagged PDF output, preserves backgrounds, and fails when either page
overflows or the document does not contain exactly two pages.

It then runs the layout QA gate and fails the render on any of these:

- text that overlaps the folio, including the 4px safety margin around it;
- content that extends past the top, bottom, left, or right content edge;
- less than 10px of clearance between the last line of content and the folio.

On success it prints a line like:

```
Layout QA passed: [{"page":1,...,"folioClearance":16.3},{"page":2,...,"folioClearance":27.5}]
```

Record both clearance values in the brief. Resolve any failure by trimming
lower-priority content or rebalancing columns. Never loosen the tolerances,
delete the call, or reduce the `.page` bottom padding below `0.44in`.

## Validate

```bash
npm run validate -- 'PATH/TO/OUTPUT.pdf' \
  --expect 'EXACT POSTED ROLE' \
  --expect 'ESSENTIAL VISIBLE EVIDENCE' \
  --qa-dir 'qa/YOUR-RESUME'
```

The validator always requires the profile's name, email, phone, LinkedIn,
portfolio, and any `requiredText` entries. Repeat `--expect` for any employer,
role, or key evidence that must survive layout editing. Add the target company
only when it is intentionally visible in the resume; the filename rule always
enforces the company identity. Page images need `pdftoppm` from poppler
(`brew install poppler`), or set `PDFTOPPM`.

Before delivery, confirm:

- exactly two US Letter pages;
- the layout QA gate passed and both pages report at least 10px folio
  clearance;
- no clipping, overlap, unexpected blank space, or broken glyphs;
- nothing touches or crosses the folio on either page;
- no role, card, or list is split or orphaned, and no heading sits alone at the
  bottom of a column;
- column bottoms on page two are not wildly unbalanced;
- every page has been visually inspected at full resolution;
- name, target title, employers, dates, metrics, skills, education, and contact
  details extract correctly;
- reading order remains understandable;
- hyperlinks work;
- the PDF is tagged;
- all claims are supported by the data store;
- the brief is complete and kept with the HTML source;
- the final PDF sits directly in the profile's output folder.

## Design rules

- Keep body text selectable; never rasterize the resume.
- Use HTML headings, lists, articles, sections, addresses, and links
  semantically so Chrome can create useful PDF tags.
- Keep the DOM in logical reading order even when CSS creates columns.
- Use CSS decoration rather than decorative characters in the text stream.
- Use compact line icons for contact methods. Retain accessible text labels
  and the full selectable contact values in semantic HTML; do not use icon
  fonts or decorative symbols that pollute PDF extraction.
- Let the target role and a written creative brief influence the art
  direction, but keep the result recognizably the candidate's.
- The starter palette and the Azeret Mono / Plus Jakarta Sans / Source Serif
  type pairing are a proven baseline, not a universal requirement. A change
  must be intentional, restrained, legible, and embeddable.
- Use one strong visual idea rather than a collection of unrelated effects.
- Prefer editing content and spacing before reducing body typography, and keep
  meaningful body text at approximately 9 pt or larger.
- Use bold sparingly: a key figure or short phrase, never a whole sentence.
- Do not remove the automated overflow check to force a render.
- Run the anti-slop and JD-mirroring reviews in `DESIGN-PRINCIPLES.md` before
  final QA.

## Output naming

`<filenamePrefix>-[Company]-[Exact-Role]-YYYY-MM-DD.pdf`, for example
`Jordan-Avery-Resume-Contoso-Head-of-Growth-2026-07-28.pdf`.

- use the recognizable company name, replacing `&` with `and`;
- use the exact posted role, with short prepositions retained when useful;
- end with the ISO date `YYYY-MM-DD`;
- do not include internal labels such as `Editorial`, `Final`, `New`, or
  version numbers;
- use ASCII hyphens and no spaces.
