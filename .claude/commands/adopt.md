---
description: Audit this project against the engineering system and propose an adoption ladder.
---

Run `kits/align/AUDIT.md` against this repository.

**Read-only. Change nothing — including `.claude/`.**

Produce `ALIGNMENT_REPORT.md` at the repo root in the shape that file specifies.

Rules:
- Counts, not adjectives. "41 relative imports across 12 files", never "significant issues".
- Section 3 (backend coupling) and section 6 (uncaptured knowledge) are the two
  that matter most. Do not compress them.
- End with the single smallest first PR that ends green — usually rung 0 of
  `kits/align/ADOPTION_LADDER.md`.
- If the project is already close to a level, say so plainly. Adoption is often
  far cheaper than expected, and an honest number is what gets it started.

Do not begin any migration work. The report is the deliverable.
