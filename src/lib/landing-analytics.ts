import { supabase } from '@/integrations/supabase/client';
export type LandingEvent = 'page_view'|'toggle_switch'|'cta_click'|'email_submit'|'listing_form_start'|'listing_form_submit'|'call_booked'|'call_requested'|'faq_open';
export function track(event:LandingEvent,properties:Record<string,string> = {}) {
 if(typeof window==='undefined') return;
 const entry = {event,...properties};
 const target=window as Window & {dataLayer?:Record<string,string>[]};
 target.dataLayer=target.dataLayer??[];
 target.dataLayer.push(entry);
 window.dispatchEvent(new CustomEvent('internship:analytics',{detail:entry}));
 void supabase.from('landing_events').insert({event,properties}).then(()=>{});
}
