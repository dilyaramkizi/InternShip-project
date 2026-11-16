import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { splitLines, splitList } from "@/lib/cv";
import { useT } from "@/lib/i18n";

export type Internship = Tables<"internships">;
export type Company = Tables<"companies">;
export type Listing = Internship & { company: Company };

export function CompanyLogo({ company, size }: { company: Company; size: "sm" | "lg" }) {
  const t = useT();
  if (company.logo_url)
    return (
      <img
        className={`ix-logo ix-logo-${size} ix-logo-img`}
        src={company.logo_url}
        alt={t.student.card.logo(company.name)}
      />
    );
  const initials = company.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <div
      className={`ix-logo ix-logo-${size}`}
      role="img"
      aria-label={t.student.card.logo(company.name)}
    >
      {initials}
    </div>
  );
}

export function VerifiedBadge() {
  const t = useT();
  return (
    <span className="ix-verified">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" fill="#2fa36b" />
        <path
          d="M7 12.5l3.2 3.2L17 9"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {t.preview.verified}
    </span>
  );
}

/** A value the company hasn't confirmed yet is labelled as such, never guessed. */
function Value({ children }: { children: ReactNode }) {
  const t = useT();
  return children ? (
    <span className="ix-value">{children}</span>
  ) : (
    <span className="ix-tbd">{t.student.card.tbd}</span>
  );
}

function useConditions(i: Internship) {
  const t = useT();
  const c = t.student.card;
  return {
    format: [c.format, i.format ? t.format[i.format] : ""],
    pay: [c.pay, i.pay],
    slots: [c.slots, i.slots == null ? "" : String(i.slots)],
    duration: [c.duration, i.duration],
  } as const;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="ix-row">
      <span className="ix-row-label">{label}</span>
      <Value>{value}</Value>
    </div>
  );
}

type Selection = { selected: boolean; applied: string | null; onToggle: () => void };

export function InternshipCard({
  listing,
  selection,
  onOpen,
}: {
  listing: Listing;
  selection: Selection;
  onOpen: () => void;
}) {
  const t = useT();
  const c = t.student.card;
  const cond = useConditions(listing);
  const skills = splitList(listing.stack);
  return (
    <article className={`ix-card ${selection.selected ? "is-selected" : ""}`}>
      <div className="ix-card-head">
        <CompanyLogo company={listing.company} size="sm" />
        <div className="ix-card-title">
          <h2>
            <button type="button" onClick={onOpen}>
              {listing.title}
            </button>
          </h2>
          <p>
            {listing.company.name} · {listing.company.city}
          </p>
        </div>
      </div>
      {listing.company.verified && (
        <div>
          <VerifiedBadge />
        </div>
      )}
      {listing.description && <p className="ix-card-desc">{listing.description}</p>}
      {skills.length > 0 && (
        <div className="ix-chips">
          {skills.slice(0, 4).map((s) => (
            <span key={s}>{s}</span>
          ))}
          {skills.length > 4 && <span>+{skills.length - 4}</span>}
        </div>
      )}
      <div className="ix-rows">
        {[cond.format, cond.pay, cond.slots].map(([label, value]) => (
          <Row key={label} label={label} value={value} />
        ))}
      </div>
      <div className="ix-card-foot">
        {selection.applied ? (
          <span className="ix-applied">
            {t.student.applied} · {t.status[selection.applied] ?? selection.applied}
          </span>
        ) : (
          <label className="ix-select">
            <input type="checkbox" checked={selection.selected} onChange={selection.onToggle} />
            {c.selectToApply}
          </label>
        )}
        <button type="button" className="ix-more" onClick={onOpen}>
          {c.details} <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ix-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

const Bullets = ({ text }: { text: string }) => (
  <ul className="ix-list">
    {splitLines(text).map((line, i) => (
      <li key={i}>{line}</li>
    ))}
  </ul>
);

export function InternshipPage({
  listing,
  selection,
  onBack,
  onApply,
  applying,
}: {
  listing: Listing;
  selection: Selection;
  onBack: () => void;
  onApply: () => void;
  applying: boolean;
}) {
  const t = useT();
  const c = t.student.card;
  const cond = useConditions(listing);
  const skills = splitList(listing.stack);
  const [contactName, ...contactDetails] = splitLines(listing.contact);
  return (
    <div className="ix-page">
      <button type="button" className="ix-back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        {c.allInternships}
      </button>
      <div className="ix-hero">
        <CompanyLogo company={listing.company} size="lg" />
        <div className="ix-hero-text">
          <p>
            {listing.company.name} · {listing.company.city}
          </p>
          <h1>{listing.title}</h1>
          {listing.department && <p className="ix-dept">{listing.department}</p>}
        </div>
        {listing.company.verified && <VerifiedBadge />}
      </div>
      <div className="ix-columns">
        <div className="ix-main">
          {listing.description && (
            <Section title={c.about}>
              <p className="ix-text">{listing.description}</p>
            </Section>
          )}
          {listing.tasks && (
            <Section title={c.whatYouDo}>
              <Bullets text={listing.tasks} />
            </Section>
          )}
          <Section title={c.requirements}>
            {listing.requirements ? (
              <Bullets text={listing.requirements} />
            ) : (
              <div>
                <Value>{null}</Value>
              </div>
            )}
          </Section>
          {listing.benefits && (
            <Section title={c.benefits}>
              <Bullets text={listing.benefits} />
            </Section>
          )}
          {skills.length > 0 && (
            <Section title={c.skills}>
              <div className="ix-chips">
                {skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </Section>
          )}
        </div>
        <aside className="ix-aside">
          <div className="ix-panel">
            <h2>{c.conditions}</h2>
            {[cond.format, cond.pay, cond.slots, cond.duration].map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
            {listing.deadline && <Row label={c.deadline} value={listing.deadline} />}
            {listing.paperwork && <p className="ix-note">{t.student.paperworkYes}</p>}
            {selection.applied ? (
              <p className="ix-applied ix-applied-block">
                {t.student.applied} · {t.status[selection.applied] ?? selection.applied}
              </p>
            ) : (
              <>
                <button type="button" className="ix-apply" onClick={onApply} disabled={applying}>
                  {applying && <Loader2 className="animate-spin" size={18} />}
                  {c.apply} <ArrowRight size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="ix-secondary"
                  aria-pressed={selection.selected}
                  onClick={selection.onToggle}
                >
                  {selection.selected ? c.removeSelected : c.addSelected}
                </button>
              </>
            )}
          </div>
          {(listing.contact || listing.location) && (
            <div className="ix-panel ix-contact">
              <h2>{c.contact}</h2>
              {contactName && <p className="ix-contact-name">{contactName}</p>}
              {contactDetails.length > 0 && (
                <p className="ix-muted">
                  {contactDetails.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              )}
              <p className="ix-contact-email">
                <span className="ix-muted">{c.email}:</span>
                {listing.contact_email ? (
                  <a href={`mailto:${listing.contact_email}`}>{listing.contact_email}</a>
                ) : (
                  <Value>{null}</Value>
                )}
              </p>
              {listing.location && <p className="ix-muted">{listing.location}</p>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
