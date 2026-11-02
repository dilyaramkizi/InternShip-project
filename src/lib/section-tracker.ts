type Gtag = (command: 'event', name: string, params: Record<string, string>) => void;

// A section counts as viewed when 30% of it is visible, or when it fills half the
// viewport — tall sections (features, FAQ on mobile) can never reach 30% of themselves.
const MIN_SECTION_RATIO = 0.3;
const MIN_VIEWPORT_COVERAGE = 0.5;
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

/**
 * Sends one GA4 `section_view` per `[data-section]` element per call.
 * Call from a useEffect (after the sections are in the DOM) and return the result as cleanup.
 */
export function trackSectionVisibility(view: string): () => void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return () => {};

  const sent = new Set<string>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const name = (entry.target as HTMLElement).dataset['section'];
        if (!name || sent.has(name)) continue;

        const viewportHeight = entry.rootBounds?.height || window.innerHeight;
        const coverage = viewportHeight ? entry.intersectionRect.height / viewportHeight : 0;
        if (entry.intersectionRatio < MIN_SECTION_RATIO && coverage < MIN_VIEWPORT_COVERAGE) continue;

        sent.add(name);
        observer.unobserve(entry.target);
        (window as Window & { gtag?: Gtag }).gtag?.('event', 'section_view', { section_name: name, view });
      }
    },
    { threshold: THRESHOLDS },
  );

  document.querySelectorAll<HTMLElement>('[data-section]').forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}
