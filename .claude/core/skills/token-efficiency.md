# Skill — Token Efficiency

A standing constraint on every task. Internalise it; do not reload it per task.

## Reading

- Load only the routing-table rows from `CLAUDE.md` §4 that match the task.
- Search before reading. Grep for the symbol; read the region, not the file.
- Read a file once. Do not re-read to "verify" an edit that succeeded.
- Do not open a file to confirm something already established in the conversation.

## Writing code

- Patch, never regenerate. A ten-line change is a ten-line diff.
- Reuse the existing component/hook/service/schema. Check before creating.
- No speculative scaffolding — build the case in front of you.
- No abstraction layer without a second real caller.

## Writing the reply

- Answer first. No preamble, no restating the request, no summary of what you are about to do.
- Show changed lines only. Never reprint unchanged code.
- Reference files by path (`src/features/billing/service.ts:42`) instead of quoting them.
- One recommendation, not a survey of alternatives — unless the tradeoff genuinely matters, and then in two lines.
- Skip the closing recap when the diff already says it.

## The test

If a shorter change or a shorter answer would be equally correct and equally clear, it is the right one. Brevity that loses correctness is not efficiency — see `CLAUDE.md` §3.
