# Changelog

Semantic versioning: MAJOR = a prop, exported type, or default behaviour changed in a way that
could break an existing consumer without any code change on their side. MINOR = additive only.
Consuming projects should pin to a tag (`#v1.0.0`), never `#main`.

## v1.0.0 — 2026-08-24

First release. `ClaudiaEventDetail` (details + RSVP) + `ClaudiaEventList` (upcoming events) --
ported from SafeSpaces' real `events`/`event_rsvps` tables and its actual 600-line
`EventDetail.tsx` (checked both before this). Real, simple find-or-create RSVP flow
(going/maybe/not_going), counts derived by filtering the fetched RSVP list.

`invited_emails`/`invited_member_ids` (granular invite ACLs), `speakers`/
`speaker_third_party_ids` (a real, separate speaker-management subsystem), and
`description_blocks` (rich content blocks) are NOT ported -- named plainly, not silently
dropped. `knowledge_article_id` IS a real field here, deliberately kept: both
`@jo51yon/claudia-events` and `@jo51yon/claudia-knowledge` now exist in the real Claudia
kernel, so a project with both installed gets a genuine, working link between an event and a
knowledge article -- not speculative.

Schema (`claudia_events`, `claudia_event_rsvps`) proven correct with real RLS tests before any
UI was built: a genuinely different authenticated session's attempt to RSVP as another user is
refused (the real policy-violation error); that same session's attempt to change someone
else's already-recorded RSVP is confirmed to silently affect zero rows by re-reading the
status afterward, not just trusting the absence of an error.

**Known consumers at this tag:** none yet at release.
