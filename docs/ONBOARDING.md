# Onboarding walkthrough

This is the script an agent follows the first time someone uses this
repository, and on every later session until onboarding is complete.
`npm run status` (run automatically at session start in Claude Code) reports
which step is next. Do not draft, tailor, or render any resume until it
reports "Onboarding complete."

Speak to the user plainly. One step at a time; do not dump this whole file on
them.

## Step 0: Greet and set up the profile

If no profile exists, open with a short welcome along these lines:

> Welcome. Before I can write tailored resumes, I need to learn your career
> from your own documents. Everything you give me stays in a private profile
> folder that is never committed to git. Where would you like that folder? The
> default is `profile/` inside this repo; a synced folder (iCloud, Dropbox)
> works too.

Then run `npm run init` (default) or `npm run init -- <folder>` and, for a
custom folder, either link it into the repo with `ln -s "<folder>" profile`
(the link is gitignored, and the pre-commit hook then always finds the
profile) or have the user add `export RESUME_PROFILE_DIR="<folder>"` to their
shell profile. Prefer the link: without it, the commit hook only sees the
profile in shells where the variable is set.

## Step 1: Ask for documents

Tell the user exactly where to put files (the profile's `intake/` folder) and
what to add. Show this list:

1. **Required: past resumes, as many versions as they have**, including old
   ones and targeted versions. Explain why: old versions keep bullets and
   metrics that newer ones dropped.
2. **Recommended: LinkedIn profile PDF** (*Profile → More → Save to PDF*).
3. **Recommended: cover letters, performance reviews, promotion write-ups, or
   a brag document**, which are the best sources of verified metrics and scope.
4. **Optional:** portfolio links (in a `links.md`), case studies,
   certifications, awards, talks, and job descriptions they are targeting.

Also say what not to add: IDs, compensation documents, references' contact
details.

If the user pastes text or drags files into the chat instead, save each one
into `intake/` yourself (for example `intake/resume-2021.md`) so the source is
kept.

## Step 2: Confirm the intake is complete

1. Run `npm run extract` to convert everything to text in `intake/.text/`.
   For any file that reports no text (usually a scanned image), ask for
   another format.
2. List back what you found: file name, what it appears to be, and the date
   range it covers.
3. Name the gaps you can see, for example: "Your newest resume stops at 2022;
   do you have anything covering 2023 onward?", "No LinkedIn export yet",
   "Nothing for the Fabrikam years beyond one bullet."
4. Ask: "Is there anything else you want to add?" Repeat steps 1–4 until the
   user says that is everything. A single resume is enough to continue if the
   user has nothing else, but always ask at least once for more.
5. Set `onboarding.intakeComplete` to `true` in `profile.json`.

On later sessions, if new files appear in `intake/`, re-run `npm run extract`
and fold the new evidence into the data store (Steps 3–4) before resume work.

## Step 3: Build the profile and data store

Fill `profile.json` from the documents:

- `name`, `contact` (location, phone, email, LinkedIn, portfolio), using the
  most recent value of each;
- `filenamePrefix`, for example `First-Last-Resume`;
- `requiredText`: the degree lines that must survive in every PDF;
- `leakGuard.terms`: the user's employers and any other identifying words,
  so the pre-commit hook blocks them too.

Confirm the identity and contact details with the user before moving on.

Then write the data store (`data-store.md`) as the single source of truth.
Structure:

```markdown
# Master Resume Data Store

## Contact
## Experience
### <Title>, <Employer> (<Mon YYYY> - <Mon YYYY or Present>, <Location / Remote>)
One line on what the company is (stage, size, market) when known.
- Verified fact: action, scope, and result, with the metric's exact wording,
  employer, and time frame. (source: <intake file name>)
- Team size, budget, reporting line when stated.
- Reason for leaving, only if a source states it.
## Additional experience (contract, fractional, volunteer)
## Skills and tools (grouped; note where each was used)
## Education and certifications
## Awards, talks, publications
## Open questions
```

Rules while building it:

- Record facts only. Merge the same bullet across resume versions into one
  entry, keeping the most specific verified wording and citing each source.
- Keep every metric attached to its employer, scope, and time frame. Never
  turn a campaign result into a total, or a quarter into a year.
- When sources disagree (dates, titles, numbers), do not pick one silently.
  Put it under **Open questions**.
- Note anything that appears in only one old version; the user may have cut
  it deliberately.

## Step 4: Review the data store with the user

Walk through **Open questions** one at a time: conflicting dates or titles,
metrics with unclear scope, roles with thin evidence. Ask short, specific
questions ("Your 2021 resume says 25% growth and the 2023 one says 30% for the
same role. Which is right, and over what period?"). Update the data store with
each answer and cite "confirmed by user, <date>".

Then ask the user to read the data store themselves and tell you anything that
is wrong or missing. When they are satisfied, set
`onboarding.dataStoreReviewed` to `true`.

## Step 5: Preferences interview

Ask these one or two at a time and write the answers into `preferences.md`:

1. Which kinds of roles are you targeting, and which are you not?
2. How should your profile paragraph sound? (First person or not; three words
   for the personality it should carry.)
3. Is anything off-limits? (Roles or employers to omit, total years of
   experience, dates you prefer not to show.)
4. Which three results are you proudest of, and how should each be phrased in
   a highlight box?
5. Any wording rules for specific metrics? (For example, "always say this
   came from a single campaign.")
6. Section headings: plain conventional labels, or room for personality?
7. Do you want a short LinkedIn message to the recruiter drafted with each
   resume?

Read the finished file back in summary, apply corrections, and set
`onboarding.preferencesReviewed` to `true`.

## Step 6: Finish

Run `npm run status` to confirm everything is checked, then run
`npm run leak-check` to confirm nothing personal is staged in the repository.
Tell the user they are ready and that the next step is to paste a job
description. From then on, follow `AGENTS.md`.
