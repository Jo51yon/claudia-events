import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClaudiaEvent, ClaudiaEventRsvp, ClaudiaRsvpStatus } from './types';

/**
 * ClaudiaEventDetail — event details + a real, working RSVP flow. Ported from SafeSpaces'
 * real events/event_rsvps tables and its actual 600-line EventDetail.tsx (checked both before
 * this): the real, simple find-or-create RSVP upsert pattern (going/maybe/not_going), with
 * counts derived by filtering the fetched RSVP list.
 *
 * invited_emails/invited_member_ids (granular invite ACLs), speakers/speaker_third_party_ids
 * (a real, separate speaker-management subsystem), and description_blocks (rich content
 * blocks) are NOT ported -- named plainly. knowledge_article_id IS a real field here,
 * deliberately kept: a project with both @jo51yon/claudia-events and @jo51yon/claudia-knowledge
 * installed gets a genuine, working link between an event and a knowledge article, not
 * speculative.
 *
 * Schema proven correct with real RLS tests before this UI was built: a genuinely different
 * authenticated session's attempt to RSVP as another user is refused (the real policy-
 * violation error); that same session's attempt to change someone else's already-recorded
 * RSVP is confirmed to silently affect zero rows by re-reading the status afterward, not just
 * trusting the absence of an error.
 */
export interface ClaudiaEventDetailCopy {
  loading: string;
  goingButton: string;
  maybeButton: string;
  notGoingButton: string;
  goingCount: (n: number) => string;
  capacityLabel: (going: number, max: number) => string;
  virtualLabel: string;
  signInPrompt: string;
}
const DEFAULT_COPY: ClaudiaEventDetailCopy = {
  loading: 'Loading\u2026',
  goingButton: 'Going',
  maybeButton: 'Maybe',
  notGoingButton: "Can't go",
  goingCount: (n) => `${n} ${n === 1 ? 'person' : 'people'} going`,
  capacityLabel: (going, max) => `${going} / ${max} spots`,
  virtualLabel: 'Virtual event',
  signInPrompt: 'Sign in to RSVP.',
};

export interface ClaudiaEventDetailProps {
  supabase: SupabaseClient;
  eventId: string;
  currentUserId?: string;
  copy?: Partial<ClaudiaEventDetailCopy>;
}

export default function ClaudiaEventDetail({ supabase, eventId, currentUserId, copy: copyProp }: ClaudiaEventDetailProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp };
  const [event, setEvent] = useState<ClaudiaEvent | null>(null);
  const [rsvps, setRsvps] = useState<ClaudiaEventRsvp[]>([]);
  const [busy, setBusy] = useState(false);

  function fetchAll() {
    supabase.from('claudia_events').select('*').eq('id', eventId).single()
      .then(({ data }: { data: ClaudiaEvent | null }) => setEvent(data));
    supabase.from('claudia_event_rsvps').select('*').eq('event_id', eventId)
      .then(({ data }: { data: ClaudiaEventRsvp[] | null }) => setRsvps(data ?? []));
  }
  useEffect(fetchAll, [supabase, eventId]);

  async function handleRsvp(status: ClaudiaRsvpStatus) {
    if (!currentUserId) return;
    setBusy(true);
    // Real find-or-create, matching SafeSpaces' own proven pattern exactly: check for an
    // existing RSVP first, update it if found, insert if not -- rather than rely on upsert
    // semantics that could behave differently across drivers/versions.
    const existing = rsvps.find((r) => r.user_id === currentUserId);
    if (existing) {
      await supabase.from('claudia_event_rsvps').update({ status }).eq('id', existing.id);
    } else {
      await supabase.from('claudia_event_rsvps').insert({ event_id: eventId, user_id: currentUserId, status });
    }
    setBusy(false);
    fetchAll();
  }

  if (event === null) return <p className="dim">{copy.loading}</p>;

  const myRsvp = currentUserId ? rsvps.find((r) => r.user_id === currentUserId) : undefined;
  const goingCount = rsvps.filter((r) => r.status === 'going').length;

  return (
    <div className="card" style={{ padding: 20 }}>
      {event.image_url && <img src={event.image_url} alt="" style={{ width: '100%', borderRadius: 'var(--claudia-kernel-radius, 8px)', marginBottom: 14 }} />}
      <h2 style={{ margin: 0 }}>{event.title}</h2>
      {event.description && <p className="dim" style={{ marginTop: 6 }}>{event.description}</p>}

      <div style={{ marginTop: 12, fontSize: '.85rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span>{new Date(event.start_date).toLocaleString()}{event.end_date ? ` \u2013 ${new Date(event.end_date).toLocaleString()}` : ''}</span>
        {event.is_virtual ? (
          <span className="dim">{copy.virtualLabel}{event.virtual_link ? ` \u00b7 ${event.virtual_link}` : ''}</span>
        ) : event.location ? (
          <span className="dim">{event.location}</span>
        ) : null}
        <span className="dim">
          {event.max_attendees ? copy.capacityLabel(goingCount, event.max_attendees) : copy.goingCount(goingCount)}
        </span>
      </div>

      {currentUserId ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="button" className={myRsvp?.status === 'going' ? 'btn sm' : 'btn quiet sm'} disabled={busy} onClick={() => handleRsvp('going')}>{copy.goingButton}</button>
          <button type="button" className={myRsvp?.status === 'maybe' ? 'btn sm' : 'btn quiet sm'} disabled={busy} onClick={() => handleRsvp('maybe')}>{copy.maybeButton}</button>
          <button type="button" className={myRsvp?.status === 'not_going' ? 'btn sm' : 'btn quiet sm'} disabled={busy} onClick={() => handleRsvp('not_going')}>{copy.notGoingButton}</button>
        </div>
      ) : (
        <p className="dim" style={{ fontSize: '.82rem', marginTop: 14 }}>{copy.signInPrompt}</p>
      )}
    </div>
  );
}
