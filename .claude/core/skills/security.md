# Skill — Security

Use when: touching auth, permissions, user input, storage, or anything reachable from outside.
Security is explicit. "Nobody would do that" is not a control.

## Threat pass (do this before coding a sensitive feature)

1. Who can reach this?
2. What could a *legitimate but hostile* user do with it?
3. What is the worst record they could read or write that isn't theirs?
4. What happens if they replay, reorder, or race the request?
5. What leaks in the error message, the log, or the URL?

## Authorisation

- Authentication answers *who*. Authorisation answers *may they touch this record*. Both, every time.
- Enforce on the **server**, at the data layer. Client-side checks are UX, never a control.
- Deny by default. New endpoints and new columns start closed.
- Least privilege: scope tokens, scope database roles, scope queries by tenant/owner.
- **IDOR is the default bug.** Any `:id` parameter must be constrained by ownership in the query itself, not checked after fetching.
- Return `404` rather than `403` when even the existence of a record is sensitive.

## Input and output

- Validate at the boundary with Zod; reject unknown fields on writes.
- Never build SQL by string concatenation — parameterise.
- Escape on output by context. Never `dangerouslySetInnerHTML` with anything user-influenced; if unavoidable, sanitise with an allowlist and record why.
- Validate uploads by content, size, and count — not by extension. Store outside the web root, serve via signed URLs.
- Treat redirect targets, file paths, and template names from user input as hostile.

## Secrets

- Never in source, commits, logs, error responses, client bundles, or analytics.
- Anything in a frontend env var is **public**. Only publishable keys go there.
- Rotate on exposure; assume anything committed is compromised even after the commit is removed.

## Sessions and tokens

- Tokens in httpOnly, Secure, SameSite cookies where possible. If a token must be in JS, keep it in memory, never `localStorage`.
- Short access token lifetime, refresh with rotation and reuse detection.
- Invalidate server-side on logout and on password/permission change.
- CSRF protection on any cookie-authenticated state-changing request.

## Rate limiting and abuse

Per-actor and per-IP limits on auth, password reset, OTP, search, export, and anything expensive. Fail closed, respond `429`, and don't reveal which account exists.

## Errors and logging

Users get a safe, actionable message. Logs get the detail — minus credentials, tokens, full card/ID numbers, and unnecessary PII. Log security-relevant decisions: authentication outcomes, permission denials, privilege changes, exports.

## Dependencies

New dependency = new attack surface. Prefer the platform. Audit before adding. Keep lockfiles committed and updates deliberate.

## Non-negotiable

Never weaken a security control to make a feature easier. If it blocks the feature, the feature design is wrong.
