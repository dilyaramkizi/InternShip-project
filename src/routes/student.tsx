import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { BadgeCheck, CheckCircle2, Download, Loader2, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CvDocument } from "@/components/cv-document";
import { DashboardShell } from "@/components/dashboard-shell";
import { InternshipCard, InternshipPage, type Listing } from "@/components/internship-views";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { cvSchema, emptyCv, type Cv } from "@/lib/cv";
import { useT } from "@/lib/i18n";
import { pilotRules } from "@/lib/internship-content";
import { track } from "@/lib/landing-analytics";
import type { Profile } from "@/lib/use-auth";

export type StudentTab = "cv" | "companies" | "applications";
const tabs: StudentTab[] = ["cv", "companies", "applications"];
type Search = { tab?: StudentTab; internship?: string };

// The catalogue is the student home page; "My CV" and "My applications" are linked from the header.
export const Route = createFileRoute("/student")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(tabs.includes(search["tab"] as StudentTab) ? { tab: search["tab"] as StudentTab } : {}),
    ...(typeof search["internship"] === "string" ? { internship: search["internship"] } : {}),
  }),
  head: () => ({ meta: [{ title: "InternShip — Student dashboard" }] }),
  ssr: false,
  component: () => (
    <DashboardShell role="student">
      {(profile) => <StudentDashboard profile={profile} />}
    </DashboardShell>
  ),
});

type Company = Tables<"companies"> & { internships: Tables<"internships">[] };
type Application = Tables<"applications"> & {
  internships: { title: string; companies: { name: string } | null } | null;
};
type Status = { ok: boolean; text: string } | null;

function StudentDashboard({ profile }: { profile: Profile }) {
  const t = useT();
  const s = t.student;
  const navigate = useNavigate();
  const search = Route.useSearch();
  const tab = search.tab ?? "companies";
  const [cv, setCv] = useState<Cv>({ ...emptyCv, full_name: profile.full_name });
  const [hasCv, setHasCv] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const loadApplications = useCallback(async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*, internships(title, companies(name))")
      .eq("student_id", profile.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    setApplications((data ?? []) as Application[]);
  }, [profile.id]);

  useEffect(() => {
    void (async () => {
      try {
        const [cvRes, compRes] = await Promise.all([
          supabase.from("student_cvs").select("*").eq("user_id", profile.id).maybeSingle(),
          supabase
            .from("companies")
            .select("*, internships(*)")
            .order("verified", { ascending: false })
            .order("name"),
        ]);
        if (cvRes.error || compRes.error) throw cvRes.error ?? compRes.error;
        if (cvRes.data) {
          const { user_id: _u, updated_at: _t, ...rest } = cvRes.data;
          setCv({ ...rest, gpa: rest.gpa == null ? null : Number(rest.gpa) });
          setHasCv(true);
        }
        setListings(
          ((compRes.data ?? []) as Company[]).flatMap(({ internships, ...company }) =>
            internships.filter((i) => i.is_open).map((i) => ({ ...i, company })),
          ),
        );
        await loadApplications();
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile.id, loadApplications]);

  const statusById = useMemo(
    () => new Map(applications.map((a) => [a.internship_id, a.status])),
    [applications],
  );
  const go = (next: Search) => void navigate({ to: "/student", search: next });

  function toggle(id: string) {
    setStatus(null);
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function apply(ids: string[]) {
    if (!hasCv) return setStatus({ ok: false, text: s.needCv });
    const fresh = ids.filter((id) => !statusById.has(id));
    if (!fresh.length) return;
    setBusy(true);
    const { error } = await supabase
      .from("applications")
      .insert(fresh.map((internship_id) => ({ internship_id, student_id: profile.id })));
    setBusy(false);
    if (error) return setStatus({ ok: false, text: t.auth.genericError });
    track("apply_submit", { count: String(fresh.length) });
    setSelected((prev) => new Set([...prev].filter((id) => !fresh.includes(id))));
    setStatus({ ok: true, text: s.applyDone(fresh.length) });
    await loadApplications();
  }

  const selection = (id: string) => ({
    selected: selected.has(id),
    applied: statusById.get(id) ?? null,
    onToggle: () => toggle(id),
  });

  if (loading)
    return (
      <p className="dash-loading">
        <Loader2 className="animate-spin" />
        {t.dash.loading}
      </p>
    );
  if (loadError) return <p className="dash-loading">{t.dash.loadFailed}</p>;

  const open = search.internship ? listings.find((l) => l.id === search.internship) : undefined;
  const feedback = (
    <>
      {!hasCv && tab !== "cv" && (
        <p className="dash-notice" role="note">
          {s.needCv}{" "}
          <button type="button" className="underline" onClick={() => go({ tab: "cv" })}>
            {s.tabs.cv} →
          </button>
        </p>
      )}
      {status && (
        <p
          role={status.ok ? "status" : "alert"}
          className={`form-status ix-status ${status.ok ? "success" : ""}`}
        >
          {status.ok && <CheckCircle2 className="inline mr-1" size={16} />}
          {status.text}
        </p>
      )}
    </>
  );
  const applyBar = selected.size > 0 && tab === "companies" && (
    <div className="apply-bar" role="region" aria-live="polite">
      <span>{s.selected(selected.size)}</span>
      <button type="button" className="underline text-sm" onClick={() => setSelected(new Set())}>
        {s.clear}
      </button>
      <Button
        variant="notice"
        type="button"
        disabled={busy}
        onClick={() => void apply([...selected])}
      >
        {busy ? <Loader2 className="animate-spin" /> : <Send />}
        {busy ? s.applying : s.applyAll(selected.size)}
      </Button>
    </div>
  );

  if (tab === "companies" && search.internship)
    return (
      <div className="ix">
        {feedback}
        {open ? (
          <InternshipPage
            listing={open}
            selection={selection(open.id)}
            onBack={() => go({})}
            onApply={() => void apply([open.id])}
            applying={busy}
          />
        ) : (
          <p className="dash-empty">
            {s.card.notFound}{" "}
            <button type="button" className="underline" onClick={() => go({})}>
              {s.card.allInternships} →
            </button>
          </p>
        )}
        {applyBar}
      </div>
    );

  return (
    <>
      <div className="dash-head">
        <div>
          <h1 className="dash-title">
            {tab === "companies" ? t.dash.hello(cv.full_name.split(" ")[0] ?? "") : s.tabs[tab]}
          </h1>
          <p className="label">
            {profile.email}
            {profile.is_pilot && (
              <span className="pilot-badge">
                <BadgeCheck size={14} />
                {t.dash.pilotBadge}
              </span>
            )}
          </p>
        </div>
      </div>
      {tab === "cv" ? (
        <CvEditor profile={profile} cv={cv} setCv={setCv} onSaved={() => setHasCv(true)} />
      ) : tab === "companies" ? (
        <div className="ix">
          {feedback}
          <Catalog
            listings={listings}
            selection={selection}
            onOpen={(id) => go({ internship: id })}
          />
          {applyBar}
        </div>
      ) : (
        <Applications applications={applications} goBrowse={() => go({})} />
      )}
    </>
  );
}

function CvEditor({
  profile,
  cv,
  setCv,
  onSaved,
}: {
  profile: Profile;
  cv: Cv;
  setCv: (cv: Cv) => void;
  onSaved: () => void;
}) {
  const t = useT();
  const f = t.student.fields;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof Cv>(key: K, value: Cv[K]) => {
    setStatus(null);
    setCv({ ...cv, [key]: value });
  };

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = cvSchema.safeParse(cv);
    if (!parsed.success)
      return setStatus({
        ok: false,
        text: `${f[parsed.error.issues[0]?.path[0] as keyof typeof f] ?? ""} — ${t.auth.genericError}`,
      });
    setBusy(true);
    const { error } = await supabase
      .from("student_cvs")
      .upsert({ ...parsed.data, user_id: profile.id, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return setStatus({ ok: false, text: t.auth.genericError });
    track("cv_saved", {});
    onSaved();
    setStatus({ ok: true, text: t.student.saved });
  }

  const text = (key: "full_name" | "headline" | "phone" | "telegram", ph?: string, max = 120) => (
    <div>
      <label className="field-label" htmlFor={`cv-${key}`}>
        {f[key]}
      </label>
      <Input
        id={`cv-${key}`}
        value={cv[key]}
        placeholder={ph}
        maxLength={max}
        onChange={(e) => set(key, e.target.value)}
        required={key === "full_name"}
      />
    </div>
  );
  const area = (
    key: "summary" | "skills" | "experience" | "projects" | "education" | "languages" | "links",
    ph: string,
    max: number,
    rows = 3,
  ) => (
    <div>
      <label className="field-label" htmlFor={`cv-${key}`}>
        {f[key]}
      </label>
      <Textarea
        id={`cv-${key}`}
        value={cv[key]}
        placeholder={ph}
        maxLength={max}
        rows={rows}
        onChange={(e) => set(key, e.target.value)}
      />
    </div>
  );

  return (
    <div className="cv-layout">
      <form className="soft-card cv-form listing-fields" onSubmit={save}>
        <p className="section-intro">{t.student.cvIntro}</p>
        {text("full_name")}
        {text("headline", f.headlinePh, 160)}
        <div>
          <label className="field-label" htmlFor="cv-program">
            {f.program}
          </label>
          <select
            id="cv-program"
            value={cv.program}
            onChange={(e) => set("program", e.target.value)}
          >
            <option value="">{t.student.choose}</option>
            {pilotRules.programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="cv-year">
              {f.year}
            </label>
            <select
              id="cv-year"
              value={cv.year ?? ""}
              onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">—</option>
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="cv-gpa">
              {f.gpa}
            </label>
            <Input
              id="cv-gpa"
              type="number"
              min={0}
              max={4}
              step={0.01}
              value={cv.gpa ?? ""}
              onChange={(e) => set("gpa", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {text("phone", "+7 7XX XXX XX XX", 40)}
          {text("telegram", "@username", 60)}
        </div>
        {area("summary", f.summaryPh, 2000)}
        {area("skills", f.skillsPh, 1000, 2)}
        {area("experience", f.experiencePh, 4000, 4)}
        {area("projects", f.projectsPh, 4000, 4)}
        {area("education", f.educationPh, 2000, 2)}
        {area("languages", f.languagesPh, 300, 1)}
        {area("links", f.linksPh, 600, 2)}
        {status && (
          <p
            role={status.ok ? "status" : "alert"}
            className={`form-status ${status.ok ? "success" : ""}`}
          >
            {status.ok && <CheckCircle2 className="inline mr-1" size={16} />}
            {status.text}
          </p>
        )}
        <div className="cv-actions">
          <Button variant="notice" type="submit" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            {busy ? t.student.saving : t.student.save}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-[54px] rounded-full px-6"
            onClick={() => window.print()}
          >
            <Download />
            {t.student.download}
          </Button>
        </div>
      </form>
      <div className="cv-preview">
        <p className="label">{t.student.preview}</p>
        <CvDocument cv={cv} email={profile.email} />
      </div>
    </div>
  );
}

function Catalog({
  listings,
  selection,
  onOpen,
}: {
  listings: Listing[];
  selection: (id: string) => { selected: boolean; applied: string | null; onToggle: () => void };
  onOpen: (id: string) => void;
}) {
  const t = useT();
  const s = t.student;
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter(
      (l) =>
        (!format || l.format === format) &&
        (!q ||
          [l.company.name, l.company.description, l.title, l.department, l.stack, l.description]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
  }, [listings, query, format]);

  return (
    <div className="browse">
      <p className="section-intro">{s.browseIntro}</p>
      <div className="browse-filters">
        <label className="search-field">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">{s.search}</span>
          <input
            type="search"
            value={query}
            placeholder={s.search}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label={s.card.format}
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          <option value="">{s.allFormats}</option>
          {pilotRules.formats.map((fm) => (
            <option key={fm} value={fm}>
              {t.format[fm]}
            </option>
          ))}
        </select>
      </div>
      {visible.length === 0 ? (
        <p className="dash-empty">{s.noCompanies}</p>
      ) : (
        <div className="ix-grid">
          {visible.map((l) => (
            <InternshipCard
              key={l.id}
              listing={l}
              selection={selection(l.id)}
              onOpen={() => onOpen(l.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Applications({
  applications,
  goBrowse,
}: {
  applications: Application[];
  goBrowse: () => void;
}) {
  const t = useT();
  if (!applications.length)
    return (
      <p className="dash-empty">
        {t.student.noApps}{" "}
        <button type="button" className="underline" onClick={goBrowse}>
          {t.student.tabs.companies} →
        </button>
      </p>
    );
  return (
    <div className="soft-card app-list">
      {applications.map((a) => (
        <div key={a.id} className="app-row">
          <span>
            <strong>{a.internships?.title}</strong>
            <span className="job-company"> · {a.internships?.companies?.name}</span>
            <span className="job-company block">
              {t.student.appliedOn} {new Date(a.created_at).toLocaleDateString()}
            </span>
          </span>
          <b className={`status s-${a.status.toLowerCase()}`}>{t.status[a.status] ?? a.status}</b>
        </div>
      ))}
    </div>
  );
}
