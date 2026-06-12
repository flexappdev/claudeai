export type BuiltinSkill = {
  slug: string;
  name: string;
  description: string;
  content: string;
};

export const BUILTIN_SKILLS: BuiltinSkill[] = [
  {
    slug: "prd",
    name: "PRD",
    description:
      "Turn a rough idea into a concise product requirements document — problem, user, scope, success metrics, risks.",
    content: `# PRD playbook

When the user invokes /prd or asks for "a PRD", produce a tight one-pager with these exact sections, in this order:

## 1. Problem
One paragraph. Who is the user? What pain are they in right now? Why is this worth solving *now* (not in six months)?

## 2. Audience + jobs-to-be-done
Bullet 2–4 user types and the job each is hiring this for. No personas with fake names — describe by role/context.

## 3. Scope
Three sub-headings:
- **In scope (v1)** — what we are building
- **Out of scope (deferred)** — explicit cuts the team will be tempted to add back; name them
- **Not building (ever)** — design constraints, anti-features

## 4. Success metrics
Pick 1 leading indicator and 1 lagging indicator. State the threshold that means "this worked." If you can't measure it, say so and propose a proxy.

## 5. Risks + mitigations
Three rows max: the riskiest assumption, the failure mode if it's wrong, the cheapest test to validate it before building.

## 6. Open questions
Numbered list of things the team must decide before kickoff. Don't fill these in — that's the next conversation.

Rules:
- No emoji, no marketing language, no "we're excited to…" framing.
- Lead with what's being cut, not what's included — scope discipline is the value.
- If the user's request is too vague, ask one clarifying question before writing.
- Length target: 400–700 words. PRDs that don't fit one screen don't get read.`,
  },
  {
    slug: "proposal",
    name: "Proposal",
    description:
      "Draft a client/internal proposal — hook, problem, recommendation, scope, price, timeline, next step.",
    content: `# Proposal playbook

When the user invokes /proposal or asks for "a proposal", structure the output as a short, decision-grade document — not a sales brochure.

## Structure (in order)

### Hook (2 sentences)
Lead with the audience's outcome, not your service. Example: *"You can ship the V2 launch in six weeks and stop carrying the legacy code. Here's the cleanest path."*

### Their problem (1 paragraph)
Show you understand what they're actually buying. Reflect back the specific pain or opportunity, in their own language where possible.

### Recommended approach (1 paragraph + 3-5 bullets)
The shape of the solution, not the implementation detail. Bullets are the work-streams or phases.

### Scope (table)
Two columns: *What's included* and *What's not*. Be ruthless about what's out — the line between "in" and "out" is where the value gets defended.

### Timeline + price
- Phase-by-phase, with a target completion date for each.
- One price (or one per phase). Avoid hourly rates unless the engagement is genuinely T+M.
- One sentence on payment terms.

### Why us (3 bullets)
Specific to the buyer's risk. Not generic credentials — what they would lose by hiring anyone else.

### Next step
One concrete action and date. "Sign and return by Friday so we can start Monday" beats "Let me know what you think."

## Rules
- Address one decision-maker; assume the proposal will be forwarded.
- Cut adjectives. "We deliver world-class…" → "We ship in 2-week loops with a working demo at the end of each."
- If the user hasn't provided context (audience, budget range, deadline), ask before writing — a generic proposal is worse than no proposal.
- Length target: 600–900 words.`,
  },
  {
    slug: "sprint",
    name: "Sprint plan",
    description:
      "Plan a 1–2 week sprint — goal, scope cut, daily breakdown, definition of done, risks.",
    content: `# Sprint plan playbook

When the user invokes /sprint or asks for "a sprint plan", produce a plan that a small team could execute on Monday morning.

## Structure

### Sprint goal (1 sentence)
The single outcome that makes this sprint a success. If you can name two, you have two sprints.

### Scope (in/out)
Two short lists. **In scope** = what gets built. **Out of scope (this sprint)** = adjacent work explicitly deferred. Naming the cut is half the value of planning.

### Day-by-day breakdown
For a 1-week sprint use Day 1–5; for 2 weeks use Week 1 Mon–Fri and Week 2 Mon–Fri. Each day:
- one-line headline (the day's deliverable)
- 2–4 sub-bullets (the tasks)
- explicit dependencies if any

### Definition of done
Bulleted, observable. *"Tests green," "Deployed to staging," "PRD updated,"* — never *"Looks good."*

### Risks + unknowns
Up to 3. For each: the risk, who owns the discovery work, the day the answer is needed.

### Demo at end
What gets shown to stakeholders on the last day and who delivers it.

## Rules
- Plan for ~70% capacity. Slack absorbs surprises; over-planning guarantees slippage.
- Code review, deploys, and testing are *work* — put them in the breakdown, don't leave them implicit.
- If the goal is too big for the timebox, propose a cut up front — don't pad the plan.
- Length target: 350–600 words.`,
  },
  {
    slug: "report",
    name: "Status report",
    description:
      "Write a weekly/monthly status report — what shipped, what didn't, what's next, what's blocked.",
    content: `# Status report playbook

When the user invokes /report or asks for "a status update", produce a short report that the reader can scan in under 90 seconds.

## Structure

### Headline (1 sentence)
The one thing the reader needs to know if they only read one line. Lead with the *result*, not the activity. *"Onboarding signups grew 22% week-over-week"* beats *"We worked on the onboarding flow."*

### What shipped
Bulleted list, ≤6 items. Each item: what + why it matters. Link the PR / doc / demo if available.

### What didn't ship (and why)
Be honest. *"Mobile dark mode — slipped to next week, blocked by design QA on contrast ratios."* This is the most-read section by senior readers; never omit it.

### Numbers
3–6 metrics with the delta from last period. Use the same metrics every report so trends emerge. If a number went down, lead with the explanation.

### Next period focus
Bulleted, ≤4 items. Each one a *deliverable*, not a verb. *"Beta-launch invite flow"* not *"Work on invites."*

### Risks + asks
Two short lists. **Risks** — things that could derail next period. **Asks** — specific help needed from the reader (intro, decision, headcount, vendor choice). Be specific or skip.

## Rules
- One paragraph max per section. Walls of text get skipped.
- Past tense for shipped; future tense for next. No present-progressive ("we are working on…") — it hides whether the work is real.
- If the audience is the CEO/board, lead with metrics. If the audience is the team, lead with shipped work.
- Length target: 300–500 words.`,
  },
];
