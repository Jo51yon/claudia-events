export type ClaudiaRsvpStatus = 'going' | 'maybe' | 'not_going';

export interface ClaudiaEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  is_virtual: boolean;
  virtual_link: string | null;
  max_attendees: number | null;
  event_type: string | null;
  image_url: string | null;
  status: 'draft' | 'published' | 'cancelled';
  knowledge_article_id: string | null;
}
export interface ClaudiaEventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: ClaudiaRsvpStatus;
}
