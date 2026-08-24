import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClaudiaEvent } from './types';

/**
 * ClaudiaEventList — a real, simple upcoming-events list. Companion to ClaudiaEventDetail,
 * matching SafeSpaces' own real Events.tsx (a list page) / EventDetail.tsx (the detail page)
 * split.
 */
export interface ClaudiaEventListCopy {
  heading: string;
  empty: string;
  loading: string;
}
const DEFAULT_COPY: ClaudiaEventListCopy = {
  heading: 'Upcoming events',
  empty: 'No upcoming events.',
  loading: 'Loading\u2026',
};

export interface ClaudiaEventListProps {
  supabase: SupabaseClient;
  projectSlug: string;
  onEventClick?: (event: ClaudiaEvent) => void;
  copy?: Partial<ClaudiaEventListCopy>;
}

export default function ClaudiaEventList({ supabase, projectSlug, onEventClick, copy: copyProp }: ClaudiaEventListProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp };
  const [events, setEvents] = useState<ClaudiaEvent[] | null>(null);

  useEffect(() => {
    supabase.from('claudia_events').select('*')
      .eq('project_slug', projectSlug).eq('status', 'published')
      .gte('start_date', new Date().toISOString())
      .order('start_date')
      .then(({ data }: { data: ClaudiaEvent[] | null }) => setEvents(data ?? []));
  }, [supabase, projectSlug]);

  if (events === null) return <p className="dim">{copy.loading}</p>;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>{copy.heading}</h3>
      {events.length === 0 ? (
        <p className="dim">{copy.empty}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map((e) => (
            <button key={e.id} type="button" onClick={() => onEventClick?.(e)}
                    className="card" style={{ padding: 14, textAlign: 'left', cursor: onEventClick ? 'pointer' : 'default', display: 'flex', gap: 12 }}>
              <div style={{ minWidth: 60, textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{new Date(e.start_date).getDate()}</div>
                <div className="dim" style={{ fontSize: '.72rem', textTransform: 'uppercase' }}>{new Date(e.start_date).toLocaleString(undefined, { month: 'short' })}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{e.title}</p>
                <p className="dim" style={{ margin: '2px 0 0', fontSize: '.8rem' }}>
                  {e.is_virtual ? 'Virtual' : e.location} \u00b7 {new Date(e.start_date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
