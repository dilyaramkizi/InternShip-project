export function trackSectionVisibility() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

  // Ищем все секции, которые мы пометили
  const sections = document.querySelectorAll('[data-section]');
  
  // Чтобы не отправлять одно и то же событие миллион раз
  const tracked = new Set<string>();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Если секция показалась на экране хотя бы наполовину (50%)
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const sectionName = entry.target.getAttribute('data-section');
          
          if (sectionName && !tracked.has(sectionName)) {
            tracked.add(sectionName);
            
            // Отправляем событие в GA4
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'section_view', {
                section_name: sectionName,
              });
            }
          }
        }
      });
    },
    { threshold: 0.5 } // Срабатывает, когда видно 50% секции
  );

  sections.forEach((section) => observer.observe(section));
}