---
name: linkbunny
description: Builds backlinks by linking backlinks to other sites. Use when user says "build backlinks" or "linkbunny"
---

# LinkBunny agent skill

Download or re-download this skill for updates at `https://getlinkbunny.com/skill.md`.

LinkBunny gives participating sites link requests and records self-reported results; it does not edit
any site. A coding agent finds a genuine place for a contextual nofollow link. The owner approves
publishing through the site's normal workflow, or rejects the request.

## Prerequisites and sequence

1. A LinkBunny account is required. The human may create an account or log in at
   `https://getlinkbunny.com`; an agent may do so only with explicitly authorized browser control.
2. An eligible paid subscription is required before entitled operations. The human must authorize
   starting, changing, or cancelling billing; an authorized browser-capable agent may operate the
   website UI for that approved action.
3. With an active subscription, create an API token in the account UI. The human must authorize
   each creation, rotation, or revocation; an authorized browser-capable agent may perform it. Copy
   the token once into an owner-approved secret store and keep it secret.
4. Use that token for the public API workflow below. The public API does not provide signup, login,
   token-management, billing, subscription-status, or other account-management endpoints.

Human authorization and browser capability are separate: only the human can authorize account,
billing, credential, site, assignment, publication, report, or rejection actions. An agent may
carry out an authorized website action only when it has explicitly authorized browser control, and
may carry out an authorized API or site action only within the approval given.

## Activation and approval gates

Use LinkBunny only when the owner explicitly asks you to onboard, register an owned site, check that
site for LinkBunny work, or report/reject an assignment. Do not autonomously sign up, log in,
subscribe, manage credentials, register sites, check in, place links, report, reject, or publish.

Obtain action-time owner authorization before signup or login/account operations, token creation or
rotation, subscription or billing changes, each site registration, assignment check-in/reservation,
publication, report, or rejection. A prior setup approval is not blanket approval for later actions.
The owner may explicitly authorize a bounded set of replacement check-ins for the current task; that
authorization covers only the stated bound. General agent autonomy does not authorize a check-in.
An assignment authorizes consideration only within the returned inventory boundary; it never
authorizes publication.

Explain assignment decisions concisely and naturally in the conversation's language (English when
the conversation is in English). Identify the target by its human-readable site or domain and the
source by an ordinary page or site-area description. Do not expose tokens, private data,
profile/assignment IDs, requested anchors, full URLs, API endpoints, or reason codes when those
plain-language descriptions are enough.

## Safety contract

- API base: `https://api.getlinkbunny.com/v1`.
- Put the account token in `Authorization: Bearer <token>`.
- Keep tokens in an owner-approved secret store. Never print, echo, log, paste into chat, include in screenshots, write to source/config tracked by Git, or commit them.
- Register only sites the owner is authorized to manage.
- Never send repository, hosting, deployment, or provider credentials to LinkBunny.
- Stay inside the exact returned inventory origin and path prefix. `/articles-old/` is not inside `/articles/`.
- Inspect the owned corpus and place a link only where it is genuinely relevant. Use truthful surrounding text and a natural anchor; the requested anchor is guidance.
- Every assigned link must include `rel="nofollow"`. Security attributes such as `noopener` may also be present.
- Reject forced, unrelated, hidden, template-wide, or thin placements. Do not create filler content merely to place a link.
- V1 is self-reported. Do not describe a report as independent verification or promise rankings, traffic, timing, permanence, DR equivalence, or search-policy safety.

## Operations

### A — Create a profile

After specific authorization, `POST /profiles` with `targetURL`, `requestedAnchor`, one documented
`category`, and `inventoryPrefix`. Both URLs must be public HTTPS URLs without credentials or
fragments, on the same registrable domain. This operation requires an active subscription. A
successful Domain Rating lookup returns `201` with status `pending_review`. LinkBunny reviews each
new profile once before it can match as a source or target. Tell the owner review is pending and
suggest asking the agent to check again after the advisory interval or once approval is confirmed.
Immediately record and retain the response's canonical `profileID` in the owner's approved private
configuration (for example, `LINKBUNNY_PROFILE_ID` in an untracked env file). Later profile updates
and check-ins require that exact ID; do not invent a label, alias, or replacement identifier. If it
was not retained, the signed-in owner can recover it from the private Account page. There is no
public profile-list endpoint.
Marketplace review is not an execution blocker; do not poll automatically. A transient rating failure returns
status `pending`; after cooldown, the next authorized check-in retries once and then reports the
review-pending state. Approval is profile-level: approved profiles use immediate assignment without
per-assignment LinkBunny approval.

If profile creation fails with `Active profile entitlement reached`, tell the owner in plain English
that they may email `hboon@getlinkbunny.com` to request a higher active-profile allowance. Do not
imply that an increase is guaranteed, automatic, free, or available through the public API.

`category` describes the registered site's domain. Choose the closest truthful value; use `other`
only when no more specific category fits:

- `developer_tools` — Software development, APIs, infrastructure, or technical tools
- `design_media` — Design, creative work, visual media, audio, or video
- `marketing_sales` — Marketing, advertising, sales, or customer acquisition
- `social_creator` — Social platforms, communities, newsletters, or creator businesses
- `business_operations` — Finance, legal, HR, productivity, or business operations
- `ecommerce` — Online stores, retail, products, or shopping services
- `other` — Sites that do not truthfully fit a more specific category

After specific authorization, `PATCH /profiles/:profileID` accepts the same fields. Changing the
target or inventory URL materially resets the profile to Domain Rating lookup and one-time review;
it cannot match during re-review. Anchor- or category-only edits preserve an existing approval.

### B — Check in

After specific authorization, `POST /profiles/:profileID/check-in`. This operation requires an
active subscription. The response contains the same existing pending assignment, one newly
reserved assignment, or `{ "assignment": null }`. A profile awaiting review instead returns
`{ "assignment": null, "status": "profile_pending_review", "message": "This site is awaiting marketplace review.", "retryAfterSeconds": 3600 }`;
the one-hour interval is advisory, and every check-in still requires specific owner authorization.
Do not poll automatically. A rejected
profile returns `profile_rejected` and must not be retried as if no assignment were available. Store
no marketplace database. Retain the returned assignment ID privately until you report or reject it;
do not expose or discard it. Do not infer that plain null is an
error. When a check-in returns plain null, tell the owner in plain English: "No assignment is
available right now. You may ask me to check again later. A later check-in is operationally safe and
idempotent when a pending assignment exists: it returns that same assignment, but if none exists it
may reserve a new assignment. Because of that, every later check-in needs your fresh, specific
authorization unless it remains inside an explicit bounded check-in authorization for this task. I
won’t poll, schedule, or retry automatically. If you just rejected an assignment, there may be no
eligible replacement until marketplace candidates change."

An assignment includes `targetDomainRating`, the target domain's Domain Rating when the assignment
was reserved. It can be `null` only for an assignment created before LinkBunny began snapshotting
this value. After receiving an assignment, tell the owner which target site or domain you will look
for a suitable place to mention and which eligible area of the source site you will inspect. This
describes the next investigation only; obtain separate owner authorization before publishing
anything.

LinkBunny matches candidates within a bounded Domain Rating gap, including the limit. The marketplace
operator may periodically adjust this range as marketplace supply changes. Being within range does
not guarantee an assignment.

Distinct profiles on distinct registrable domains may match even when the same account owns them;
balances remain isolated per profile. A profile is never eligible to target itself. LinkBunny does not assign the reverse of a
pair while the first direction is pending or after it is reported. Expiry or rejection releases
reverse-direction eligibility.

A target is excluded after three successfully settled inbound backlinks during the current UTC
calendar day. Pending, rejected, and expired/unreported assignments do not consume this daily
capacity; eligibility resets at the next UTC midnight.

```sh
curl -X POST -H "Authorization: Bearer $LINKBUNNY_API_TOKEN" \
  "https://api.getlinkbunny.com/v1/profiles/$LINKBUNNY_PROFILE_ID/check-in"
```

The request has no body, so omit `Content-Type`. Clients that always send JSON may send `{}`.

### C — Report completion

Before requesting separate publication authorization, name the target site or domain, the existing
source page or eligible site area, and the genuine editorial context and placement you propose.
Follow the owner's normal publication workflow only after authorization. After it succeeds, inspect
the rendered/live result. Confirm the exact `pageURL` is within `inventoryPrefix`, the actual anchor
matches what was published, and the link contains `nofollow`. Tell the owner plainly what was linked
and where, then obtain report-completion authorization without unnecessary API jargon. After
authorization, `PUT /assignments/:assignmentID/report` with `pageURL`, `actualAnchor`, and
`linkAttribute: "nofollow"`; once confirmed, say that LinkBunny recorded the placement.

### C — Reject

If no suitable context exists or publication should not proceed, make no site change. After specific
rejection authorization, `PUT /assignments/:assignmentID/reject` with one of
`no_relevant_context`, `target_unavailable`, `policy_conflict`, or `other`.
Before requesting that authorization, name the target site or domain and give the specific
plain-language reason no suitable context exists or publication should not proceed. A rejected
outcome uses the reject endpoint, never the report endpoint.

After LinkBunny durably confirms the rejection, clearly say which target was rejected and why, then
ask whether the owner wants one check-in now for another assignment. If the owner already explicitly
authorized autonomous or batch replacement check-ins for this task, perform that one next check-in
under the existing authorization instead of asking again. Never infer this authorization from
general agent autonomy, and never schedule, poll, create an infinite rejection/check-in loop, or
continue beyond the explicit bound. The rejected assignment is no longer pending, so the
same-pending-assignment behavior does not apply: the next check-in may return no assignment or
reserve a new assignment.

Rejection permanently excludes only that exact directional pair (source profile → target profile)
from future matching; the reverse direction remains eligible. It releases the target reservation
immediately, so another source may receive its own assignment with a fresh seven-day deadline.

If the owner later publishes the originally requested backlink, obtain report-completion
authorization and use the original rejected assignment ID no later than its unchanged original
`expiresAt`. The exact timestamp is included. Rejection does not extend or restart the window, and a rejected
assignment has no 30-day late-report window. A successful reconsidered report returns `reported`.

## Retry and status rules

B and identical successful C requests are idempotent. Retry the same operation and assignment after a
transport interruption; a retry does not require new authorization when it is strictly the same
previously authorized action. Never change report/reject details merely to make a retry pass. A
conflicting report or rejection retry returns `409 idempotency_conflict`; another terminal conflict
may return `409 terminal_conflict`. Expected errors use `{ "error": { "code", "message" } }` with
400 invalid request, 401 credential failure, 403 entitlement failure, 404 unavailable owned
resource, or 409 terminal conflict.

When create-profile or check-in returns a subscription-required `403`, tell the owner that a paid
LinkBunny subscription is required and must be completed through the account website at
`https://getlinkbunny.com/account`. Do not imply that signup, billing, token creation, or account
status is available through the public API. Report and reject remain available for already-issued
assignments so they can be settled after entitlement ends.

Pending assignments expire at their seven-day deadline. Expiration releases the reservation but
does not permanently exclude the directional pair. Report completion for the exact original
pending assignment remains available for 30 days after expiry as `reported_late`; do not treat that
window as permission to publish without current owner authorization. Rejected assignments instead
close at their original seven-day deadline and return `409 terminal_conflict` afterward.

Reverse assignment after expiry or rejection does not revoke these late or reconsidered reporting
rights. A valid report may therefore settle both directions; existing reciprocal assignments and
settlements also remain valid.

Because a rejected assignment releases its target immediately, its reconsidered report and reports
from newer assignments may all settle backlinks to that same target. The target profile balance may
temporarily fall below the ordinary target-selection allowance, including -2 or lower. The target
remains eligible as a source and recovers one balance step for every outbound placement it completes
until its profile-scoped balance moves back toward zero.
