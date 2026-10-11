# Internship Bulletin Board

PROMPT START

Build a complete, publish-ready landing page for InternShip — an online marketplace where 4th-year School of Digital Technologies students at Narxoz University find pre-diploma internships, and where small/medium Almaty IT employers list internship slots.

Design style — "The Noticeboard" (quirky + memorable):
The page should feel like a university noticeboard covered in sticky notes, rubber stamps, and hand-drawn arrows — charming and human, but grid-aligned and conversion-focused. No corporate SaaS look, no stock photos of handshakes.

Palette (60/30/10):

60% background: soft off-white paper #F6F5F1 with a faint 24px dotted grid at 4% opacity.

30% structure: deep midnight blue #101B3B for headings, icons, card borders, footer.

10% CTA only: vibrant orange #E64A0F on primary buttons, the toggle knob, and doodle arrows. White bold text on buttons (≥18px for AA contrast).

Accent: electric mint #00E0A4 for verified checkmarks and success states.

Sticky-note yellow #FFE066 for social proof cards only.

Typography:

Headlines: chunky display font (Shrikhand or Archivo Black), midnight blue ink.

Body: Inter or DM Sans, clean and legible.

Labels/stamps: Space Mono uppercase.

Signature elements:

A chunky physical light-switch toggle labeled 🎓 STUDENT / 🏢 COMPANY, sticky in the top-right on scroll (bottom bar on mobile), with a hand-drawn orange arrow and "flip me" scribble pointing at it on first load.

Social proof on rotated yellow sticky notes with curled corners (max ±2° rotation).

A "VERIFIED BY NARXOZ" rubber-stamp badge on company cards.

Hand-drawn SVG doodle arrows/circles in orange and blue pointing at CTAs and key numbers. All doodles are aria-hidden; real text carries the meaning.

Cards: white background, 2px midnight blue border, 6px radius, hard offset shadow 4px 4px 0 #101B3B. Alternate cards rotate ±1.5°.

Respect prefers-reduced-motion: disable rotation-on-scroll, wobble, and arrow draw animations.

Page behavior — reversible view:
The whole page has two full 10-step views: student (default) and company. The toggle swaps the entire page copy, visual, and CTAs with a 200ms fade. Store state in URL query ?view=student or ?view=company so links are shareable. Instant swap under reduced motion.

Page structure — 10 steps, repeated for both views:

Above the fold:

Title — own the niche in one line.

Subtitle — introduce InternShip and explain how it delivers the title's value.

Visual — realistic product mockup (not stock art). Student view: internship catalogue cards (task, tech stack tags, location, pay, open slots, VERIFIED stamp) beside an application dashboard with statuses (Applied → Viewed → Interview → Offer) and a Telegram notification popping in. Company view: listing-creation form beside a candidate pipeline view. Annotate with 2–3 orange doodle arrows.

Social proof — 3 rotated yellow sticky notes with paraphrased interview quotes, plus an ink-stamp stat line beneath.

CTA — primary orange button + inline email field.

Below the fold:

Features + objections — 2-column table (desktop), stacked mobile: Feature | Objection in their words | Our answer.

More social proof — 3 cards with photo, quote, outcome, mint checkmark.

FAQ — single-column accordion, max 720px, mono uppercase labels.

Second CTA — centered orange button + email + 3 benefit bullets + doodle arrow.

Founder's note — narrow column with handwritten-style signature, midnight blue footer below.

COPY — STUDENT VIEW:

Title: Find a real digital internship in 7 days — even if the Career Center couldn't help.

Subtitle: InternShip is an online marketplace where 4th-year Narxoz Digital Technologies students build one profile and CV, browse companies verified to accept interns, apply to several at once, and track every application in one dashboard with Telegram notifications.

Social proof sticky notes:

"I just asked around. That's how everyone I know found theirs." — 4th-year DMD student

"I cold-applied to 14 companies. Got two replies." — 4th-year Cybersecurity student

"My internship came through a friend's cousin. Not a portal." — 4th-year DE student

Ink stamp beneath: 18 of 20 students we interviewed searched informally. 8 cold-applied to 10+ companies. 11 got placements through personal contacts.

Primary CTA button: Find my internship →
Microcopy under field: "Drop your email — we'll open your profile and ping you on Telegram. No spam, ever."

Features/objections table:

One profile + CV | "I've filled out five different forms already." | Build it once. Every company sees the same profile.

Verified companies only | "Half these listings are fake or already closed." | Every company is confirmed to accept Narxoz interns before it's listed.

Multi-apply | "Applying one by one takes forever." | Apply to several internships in one click.

One dashboard | "I lose track of who replied." | Every application, every status, one screen.

Telegram alerts | "I only check email once a week." | Status changes hit your Telegram instantly.

Paperwork support | "The university paperwork is a maze." | We generate the pre-diploma internship documents your program requires.

Objection banner (circled in doodle): "Cold applications get answered 5–30% of the time. Verified listings get answered because the company already said yes to interns."

Second CTA: Ready to stop asking around? / One profile. Verified companies. One dashboard. / [Find my internship →] + email field + "Takes 4 minutes. Telegram notifications on."

Founder's note: We watched our classmates cold-apply into silence. We watched internships go to whoever knew somebody. InternShip exists so the next 4th-year student at Narxoz doesn't have to guess, beg, or wait. One profile, real companies, one place to track it all. — The InternShip team, Narxoz School of Digital Technologies

COPY — COMPANY VIEW:

Title: Fill your intern slots with verified Narxoz digital students — in one listing.

Subtitle: InternShip is an online marketplace where Almaty IT employers post real internship slots with tasks, requirements, and a contact person, and receive applications from 4th-year Narxoz Digital Technologies students who are already screened by their program.

Social proof sticky notes (placeholders — replace with real interviewee words):

"We post on three channels and still get unqualified CVs." — Almaty IT founder

"We'd take interns if someone pre-filtered them." — SME hiring lead

Ink stamp: 4th-year students, verified by Narxoz program, all looking for pre-diploma internships now.

Primary CTA button: List an internship slot →
Microcopy: "Takes 5 minutes. We confirm your listing before it goes live." Secondary link: "Or book a 15-min call."

Features/objections table:

Free verified listing | "Why would I pay to post?" | Free for the pilot. Post a slot, see applicants.

Pre-screened students | "I don't have time to filter CVs." | Every applicant is a 4th-year Narxoz Digital Technologies student, verified by program.

Tasks + requirements + contact person | "Interns show up with no idea what to do." | You define the task, stack, and contact person up front.

One dashboard for applicants | "Applications get scattered across email." | Every applicant in one pipeline view with statuses.

Telegram alerts | "I'll forget to check." | New applicant → Telegram ping.

Paperwork support | "The university paperwork is on us." | InternShip generates the pre-diploma internship documents both sides sign.

Objection banner: "You said yes to interns — you just don't have a channel that delivers the right ones. This is that channel."

Second CTA: Have an intern slot to fill this semester? / Free listing. Verified students. One pipeline. / [List an internship slot →] + email field + "We'll confirm your listing within 1 business day."

Founder's note: We built InternShip because small Almaty IT teams told us the same thing: they'd take interns, but posting and filtering costs more time than it saves. So we made listing a slot take five minutes — and made every applicant a verified 4th-year Narxoz Digital Technologies student. — The InternShip team

FAQ (same for both views, wording adapts by audience):

Who can apply? 4th-year students of DMD, Cybersecurity, and DE at Narxoz School of Digital Technologies.

How are companies verified? We confirm in writing that the company accepts interns, has a real task list, and names a contact person before listing.

Is the paperwork handled? Yes — InternShip generates the pre-diploma internship documents your program requires.

How are pay and format shown? Every listing shows pay (or "unpaid"), format (office / hybrid / remote), location, and number of open slots. No surprises.

Does it cost students anything? No. Free for students.

What if no company replies? Your dashboard shows it, and we nudge the company contact. You'll never wonder.

What does it cost companies? Free during the pilot.

Can I pause or close a listing? Yes, from your dashboard anytime.

Analytics events to wire in:

page_view with view=student|company

toggle_switch (from, to)

cta_click with cta_id (student_hero, student_footer, company_hero, company_footer)

email_submit (student)

listing_form_start / listing_form_submit (company)

call_booked (company)

faq_open (question id)

Layout constants:

Max content width 1120px; 96px vertical rhythm desktop, 64px mobile.

Hero: 55/45 split, copy left, mockup right. Toggle sits directly above the title, centered.

Cards: white, 2px solid #101B3B, radius 6px, shadow 4px 4px 0 #101B3B.

Never rotate headings or body text — only cards, sticky notes, and stamps.

Accessibility:

Contrast AA: #101B3B on #F6F5F1 = 15.8:1; white bold ≥18px on #E64A0F = 4.6:1.

Doodle arrows are decorative only (aria-hidden="true").

Full keyboard support for the toggle and accordion.

prefers-reduced-motion disables all rotation, wobble, and arrow-draw animation.

Deliverable: a single responsive page, mobile-first, ready to publish, with the student view as default and the company view one toggle away. Include the sticky top-right toggle (mobile: bottom sticky bar), the dotted-paper background, sticky-note social proof, rubber-stamp verification, and hand-drawn doodle accents throughout. No placeholder lorem ipsum — all text is above.

PROMPT END

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b6ada516-2aff-5b15-a3f0-2aaf2cfd1259).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
