# Editorial Resume Design Principles

## The benchmark

The quality bar for this system is not a particular stripe, typeface, or
two-column moment. A strong resume here succeeds through the combination of:

- a bold, immediate identity;
- a human first-person opening;
- visible commercial proof without metric overload;
- clear hierarchy and generous breathing room;
- an editorial point of view;
- disciplined repetition;
- semantic, selectable, ATS-readable content;
- design that feels authored rather than decorated.

Future resumes should preserve those qualities while remaining free to find a
new visual language.

## Current production styling baseline

New projects begin from the starter template (`templates/starter.html`, or
the starter named in the profile). Preserve these defaults unless the target opportunity and completed
creative brief support a stronger alternative:

- simple conventional section headings without creative qualifiers;
- a dedicated heading rail wide enough for the selected typeface, separated
  from content and timeline nodes by a clearly visible horizontal gutter;
- generous, consistent white space between every major section;
- three separated proof panels using a pale background field and a strong
  accent top rule so metrics remain prominent without becoming a dense band;
- a focused four-item capability row rather than a crowded capability matrix;
- compact, conventional line icons in the contact block so long URLs have
  enough horizontal room, with accessible text labels retained semantically;
- selective editing of lower-priority evidence before any reduction in type
  size or inter-section spacing.
- restrained inline emphasis: bold key figures or a short phrase, not entire
  sentences or multi-line bullets.

The baseline is a hierarchy and pacing system, not a fixed palette or employer
skin. Color, typography, and motif may evolve while preserving its clarity,
evidence prominence, and breathing room.

## Start with a creative brief

Before changing HTML or CSS, write four or five sentences answering:

1. What is the single idea this resume should communicate before it is read?
2. Which two or three aspects of the candidate's experience matter most for this role?
3. What typography mood fits the opportunity and the candidate's voice?
4. What restrained palette supports that mood, and why?
5. What single visual motif will organize the pages?

Examples of useful motifs include an editorial spine, modular field notes,
signal paths, annotated evidence, a publication masthead, or structured
workbench geometry. A motif is a system, not a sticker.

## Permission to create

The designer may change:

- the page composition and column structure;
- typography, scale, and pairing;
- palette and accent treatment;
- section names and narrative pacing;
- the way metrics, competencies, and timelines are expressed;
- borders, rules, background fields, and other CSS-built furniture;
- the balance between editorial voice and compact evidence.

Creativity must remain compatible with a two-page, semantic, selectable,
tagged, readable, and extractable resume.

## Clear section taxonomy

Section headings are navigation before they are voice. A reader should know
what a section contains without reading the copy beneath it.

- Include the conventional section type in the visible heading: `Professional
  profile`, `Core capabilities`, `Professional experience`, `Additional
  experience`, `Skills & tools`, or `Education`.
- A brief creative qualifier is welcome when it adds meaning, but pair it with
  the conventional label rather than using it alone—for example,
  `Core capabilities / How I create growth`.
- Do not use an unexplained metaphor as the only label. Headings such as
  `Operating thesis`, `Growth ledger`, `Current lens`, or `Additional signal`
  create unnecessary interpretation cost.
- Match the label to the contents. If one section combines supporting roles,
  tools, and education, name all three or break it into clearly labeled
  subsections.
- Apply the five-second test: a recruiter scanning only the headings should be
  able to describe the document's structure accurately.

## Anti-slop gate

Reject these defaults unless the creative brief provides a compelling reason:

- neon or multicolor gradients added only to appear modern;
- glassmorphism, glow, faux depth, or glossy dashboard styling;
- excessive rounded cards, pills, badges, and chips;
- generic sparkles, rockets, brains, robots, circuit icons, or stock AI imagery;
- fake charts, gauges, progress bars, skill ratings, or decorative data;
- random icons used in place of clear section or navigation labels; restrained
  contact-method icons are the intentional exception when their accessible
  labels and full selectable values remain in the semantic HTML;
- empty superlatives and slogan fragments;
- generic sections such as "superpowers" or "my journey" without a genuine
  voice or useful information;
- symmetrical component grids used only because they are easy to generate;
- too many fonts, colors, effects, motifs, or competing focal points;
- visual novelty that harms reading order, ATS extraction, or credibility;
- employer-brand mimicry that makes the resume feel like unofficial corporate
  collateral rather than the candidate's own work.

## Human-authorship test

Before final QA, ask:

- Does the opening sound like the candidate rather than a resume generator?
- Is there one clear visual idea?
- Is every metric attached to a credible story and employer?
- Does each major role make clear what changed, rather than merely inventorying
  responsibilities, tools, and channels?
- Is the complete experience history still reverse chronological across both
  pages and all experience sections?
- Is bold emphasis selective enough to guide the eye without turning a full
  line into a visual block?
- Does the design reveal judgment, or merely demonstrate CSS capability?
- Can a reader find the target title, strongest proof, recent roles, and
  contact information within seconds?
- Can a reader identify profile, capabilities, experience, skills, and
  education from the headings alone?
- Would removing an element make the page clearer? If yes, remove it.
- Could this exact design and language belong to any candidate? If yes, revise.
- Is anything present solely because it looks "AI-ish" or fashionable? If yes,
  remove it.

The goal is not maximum decoration. The goal is a resume with taste,
personality, evidence, and unmistakable intention.

## JD-mirroring test

The job description should determine what evidence receives emphasis, but it
should not determine the resume's voice or section taxonomy.

Before delivery:

1. Compare the resume's profile, section headings, capability labels, and short
   descriptors with the job posting.
2. Keep the exact job title and genuinely necessary ATS terminology.
3. Flag distinctive phrases or sequences that appear borrowed from the posting,
   especially when several labels follow the same order as the JD.
4. Rewrite flagged language from the evidence outward: employer, action,
   operating pattern, and outcome.
5. Require every capability label to connect to at least one verified role,
   accomplishment, tool, or repeated pattern in the profile's data store.

A strong tailored resume should make the employer think "this person fits what
we need," not "this person copied what we wrote."
