ALTER TABLE public.landing_events DROP CONSTRAINT IF EXISTS landing_events_event_check;
ALTER TABLE public.landing_events ADD CONSTRAINT landing_events_event_check CHECK (event IN ('page_view','toggle_switch','cta_click','email_submit','listing_form_start','listing_form_submit','call_booked','faq_open','call_requested','section_view'));
