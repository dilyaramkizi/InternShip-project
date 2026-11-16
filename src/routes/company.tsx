import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CvDocument } from "@/components/cv-document";
import { DashboardShell } from "@/components/dashboard-shell";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { rankApplicants, type Cv } from "@/lib/cv";
import { useT } from "@/lib/i18n";
import { pilotRules } from "@/lib/internship-content";
import { track } from "@/lib/landing-analytics";
import type { Profile } from "@/lib/use-auth";

type Tab = "positions" | "add";
type Search = { tab?: Tab; internship?: string; edit?: string };

export const Route = createFileRoute("/company")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(search["tab"] === "add" || search["tab"] === "positions" ? { tab: search["tab"] } : {}),
    ...(typeof search["internship"] === "string" ? { internship: search["internship"] } : {}),
    ...(typeof search["edit"] === "string" ? { edit: search["edit"] } : {}),
  }),
  head: () => ({ meta: [{ title: "InternShip — Company dashboard" }] }),
  ssr: false,
  component: () => (
    <DashboardShell role="company">
      {(profile) => <CompanyDashboard profile={profile} />}
    </DashboardShell>
  ),
});

type Company = Tables<"companies">;
type Internship = Tables<"internships">;

function CompanyDashboard({ profile }: { profile: Profile }) {
  const t = useT();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [company, setCompany] = useState<Company | null>(null);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: companyId, error } = await supabase.rpc("my_company_id");
      if (error) throw error;
      if (!companyId) return setCompany(null);
      const [c, i] = await Promise.all([
        supabase.from("companies").select("*").eq("id", companyId).single(),
        supabase
          .from("internships")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
      ]);
      if (c.error || i.error) throw c.error ?? i.error;
      setCompany(c.data);
      setInternships(i.data ?? []);
      const ids = (i.data ?? []).map((x) => x.id);
      const apps = ids.length
        ? await supabase.from("applications").select("internship_id").in("internship_id", ids)
        : { data: [], error: null };
      if (apps.error) throw apps.error;
      const next: Record<string, number> = {};
      for (const a of apps.data ?? []) next[a.internship_id] = (next[a.internship_id] ?? 0) + 1;
      setCounts(next);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void load(), [load]);

  const go = (s: Search) => void navigate({ to: "/company", search: s });

  if (loading)
    return (
      <p className="dash-loading">
        <Loader2 className="animate-spin" />
        {t.dash.loading}
      </p>
    );
  if (loadError) return <p className="dash-loading">{t.dash.loadFailed}</p>;
  if (!company) return <CompanyForm ownerId={profile.id} onSaved={() => void load()} />;

  const selected = internships.find((i) => i.id === search.internship);
  const editing = internships.find((i) => i.id === search.edit);
  const tab = search.tab ?? "positions";

  return (
    <>
      <div className="dash-head">
        <div>
          <h1 className="dash-title">{company.name}</h1>
          <p className="label">
            {profile.email}
            {company.verified ? (
              <span className="verified ml-2">
                <CheckCircle2 aria-hidden="true" />
                {t.preview.verified}
              </span>
            ) : (
              <span className="pilot-badge">
                <Clock size={14} />
                {t.company.unverified}
              </span>
            )}
          </p>
        </div>
        <CompanyEdit company={company} onSaved={() => void load()} />
      </div>
      {selected ? (
        <Applicants internship={selected} back={() => go({})} />
      ) : (
        <>
          <div className="dash-tabs" role="tablist">
            <button
              role="tab"
              type="button"
              aria-selected={tab === "positions" && !editing}
              onClick={() => go({})}
            >
              <Users size={16} />
              {t.company.tabs.positions}
              {internships.length > 0 && <span className="count">{internships.length}</span>}
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={tab === "add" || !!editing}
              onClick={() => go({ tab: "add" })}
            >
              <Plus size={16} />
              {editing ? t.company.edit : t.company.tabs.add}
            </button>
          </div>
          {tab === "add" || editing ? (
            <InternshipForm
              key={editing?.id ?? "new"}
              companyId={company.id}
              initial={editing}
              onDone={() => {
                void load();
                go({});
              }}
            />
          ) : (
            <Positions
              internships={internships}
              counts={counts}
              reload={() => void load()}
              go={go}
            />
          )}
        </>
      )}
    </>
  );
}

function CompanyForm({
  ownerId,
  company,
  onSaved,
}: {
  ownerId?: string;
  company?: Company;
  onSaved: () => void;
}) {
  const t = useT();
  const c = t.company;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      website: String(form.get("website") ?? "").trim(),
      city: String(form.get("city") ?? "").trim() || "Almaty",
      logo_url: String(form.get("logo_url") ?? "").trim(),
    };
    if (!values.name) return setError(c.name);
    setBusy(true);
    const { error: err } = company
      ? await supabase.from("companies").update(values).eq("id", company.id)
      : await supabase.from("companies").insert({ ...values, owner_id: ownerId ?? null });
    setBusy(false);
    if (err) return setError(t.auth.genericError);
    onSaved();
  }
  return (
    <form className={`listing-fields ${company ? "" : "soft-card setup-card"}`} onSubmit={submit}>
      {!company && (
        <>
          <h1 className="dash-title">{c.setupTitle}</h1>
          <p className="section-intro">{c.setupIntro}</p>
        </>
      )}
      <div>
        <label className="field-label" htmlFor="co-name">
          {c.name}
        </label>
        <Input id="co-name" name="name" required maxLength={120} defaultValue={company?.name} />
      </div>
      <div>
        <label className="field-label" htmlFor="co-desc">
          {c.description}
        </label>
        <Textarea
          id="co-desc"
          name="description"
          maxLength={2000}
          rows={4}
          defaultValue={company?.description}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="co-web">
            {c.website}
          </label>
          <Input
            id="co-web"
            name="website"
            maxLength={200}
            defaultValue={company?.website}
            placeholder="https://"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="co-city">
            {c.city}
          </label>
          <Input id="co-city" name="city" maxLength={80} defaultValue={company?.city ?? "Almaty"} />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="co-logo">
          {c.logoUrl}
        </label>
        <Input
          id="co-logo"
          name="logo_url"
          type="url"
          pattern="https://.*"
          maxLength={500}
          defaultValue={company?.logo_url}
          placeholder="https://"
        />
      </div>
      {error && (
        <p role="alert" className="form-status auth-error">
          {error}
        </p>
      )}
      <Button variant="notice" type="submit" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        {company ? c.saveCompany : c.create}
      </Button>
    </form>
  );
}

function CompanyEdit({ company, onSaved }: { company: Company; onSaved: () => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" className="rounded-full" onClick={() => setOpen(true)}>
        <Pencil />
        {t.company.edit}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="notice-dialog">
          <DialogTitle className="font-display text-2xl">{company.name}</DialogTitle>
          <DialogDescription>{t.company.setupIntro}</DialogDescription>
          <CompanyForm
            company={company}
            onSaved={() => {
              setOpen(false);
              onSaved();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function Positions({
  internships,
  counts,
  reload,
  go,
}: {
  internships: Internship[];
  counts: Record<string, number>;
  reload: () => void;
  go: (s: Search) => void;
}) {
  const t = useT();
  const c = t.company;
  if (!internships.length)
    return (
      <p className="dash-empty">
        {c.noPositions}{" "}
        <button type="button" className="underline" onClick={() => go({ tab: "add" })}>
          {c.tabs.add} →
        </button>
      </p>
    );
  async function setOpen(i: Internship, isOpen: boolean) {
    await supabase.from("internships").update({ is_open: isOpen }).eq("id", i.id);
    reload();
  }
  async function remove(i: Internship) {
    if (!window.confirm(c.confirmRemove)) return;
    await supabase.from("internships").delete().eq("id", i.id);
    reload();
  }
  return (
    <div className="position-grid">
      {internships.map((i) => (
        <article key={i.id} className="soft-card position-card">
          <div className="position-card-top">
            <span className={`status ${i.is_open ? "s-offer" : ""}`}>
              {i.is_open ? c.open : c.closed}
            </span>
            <span className="label">
              {i.format ? t.format[i.format] : c.form.notSpecified}
              {i.slots != null && ` · ${t.preview.slot(i.slots)}`}
            </span>
          </div>
          <h2>{i.title}</h2>
          {i.department && <p className="job-company">{i.department}</p>}
          <button
            type="button"
            className="applicant-count"
            onClick={() => go({ internship: i.id })}
          >
            <Users size={18} />
            <strong>{counts[i.id] ?? 0}</strong>{" "}
            {c.applicantsCount(counts[i.id] ?? 0).replace(/^\d+\s/, "")}
          </button>
          <div className="position-actions">
            <Button
              variant="ink"
              size="sm"
              className="rounded-full"
              onClick={() => go({ internship: i.id })}
            >
              <Eye />
              {c.viewApplicants}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => go({ edit: i.id })}
            >
              <Pencil />
              {c.edit}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => void setOpen(i, !i.is_open)}
            >
              {i.is_open ? c.close : c.reopen}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              aria-label={c.remove}
              onClick={() => void remove(i)}
            >
              <Trash2 />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function InternshipForm({
  companyId,
  initial,
  onDone,
}: {
  companyId: string;
  initial?: Internship | undefined;
  onDone: () => void;
}) {
  const t = useT();
  const f = t.company.form;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "").trim();
    const values: TablesInsert<"internships"> = {
      company_id: companyId,
      title: get("title"),
      department: get("department"),
      description: get("description"),
      tasks: get("tasks"),
      requirements: get("requirements"),
      stack: get("stack"),
      format: pilotRules.formats.includes(get("format") as never) ? get("format") : null,
      location: get("location") || "Almaty",
      pay: get("pay"),
      slots: get("slots")
        ? Math.max(1, Math.min(100, Math.floor(Number(get("slots")) || 1)))
        : null,
      benefits: get("benefits"),
      contact_email: get("contact_email"),
      duration: get("duration"),
      deadline: get("deadline") || null,
      contact: get("contact"),
      paperwork: form.get("paperwork") === "on",
    };
    if (!values.title) return setError(f.title);
    setBusy(true);
    const { error: err } = initial
      ? await supabase.from("internships").update(values).eq("id", initial.id)
      : await supabase.from("internships").insert(values);
    setBusy(false);
    if (err) return setError(t.auth.genericError);
    if (!initial) track("internship_created", { format: values.format ?? "unspecified" });
    onDone();
  }

  const field = (
    name: keyof Internship,
    label: string,
    opts: { type?: string; placeholder?: string; max?: number; required?: boolean } = {},
  ) => (
    <div>
      <label className="field-label" htmlFor={`in-${name}`}>
        {label}
      </label>
      <Input
        id={`in-${name}`}
        name={name}
        type={opts.type ?? "text"}
        placeholder={opts.placeholder}
        maxLength={opts.type ? undefined : (opts.max ?? 160)}
        min={opts.type === "number" ? 1 : undefined}
        max={opts.type === "number" ? 100 : undefined}
        required={opts.required}
        defaultValue={initial ? String(initial[name] ?? "") : name === "location" ? "Almaty" : ""}
      />
    </div>
  );
  const area = (name: keyof Internship, label: string, rows = 3, max = 4000) => (
    <div>
      <label className="field-label" htmlFor={`in-${name}`}>
        {label}
      </label>
      <Textarea
        id={`in-${name}`}
        name={name}
        rows={rows}
        maxLength={max}
        defaultValue={initial ? String(initial[name] ?? "") : ""}
      />
    </div>
  );

  return (
    <form className="soft-card listing-fields internship-form" onSubmit={submit}>
      {field("title", f.title, { required: true })}
      {field("department", f.department)}
      {area("description", f.description, 4)}
      <div>
        {area("tasks", f.tasks)}
        <p className="microcopy">{f.tasksHint}</p>
      </div>
      {area("requirements", f.requirements)}
      {area("benefits", f.benefits)}
      <div>
        {field("stack", f.stack, { placeholder: "SQL, Python, Spark", max: 400 })}
        <p className="microcopy">{f.stackHint}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="in-format">
            {f.format}
          </label>
          <select
            id="in-format"
            name="format"
            defaultValue={initial ? (initial.format ?? "") : "hybrid"}
          >
            <option value="">{f.notSpecified}</option>
            {pilotRules.formats.map((fm) => (
              <option key={fm} value={fm}>
                {t.format[fm]}
              </option>
            ))}
          </select>
        </div>
        <div>
          {field("slots", f.slots, { type: "number" })}
          <p className="microcopy">{f.slotsHint}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field("location", f.location)}
        {field("pay", f.pay, { max: 120 })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field("duration", f.duration, { placeholder: f.durationPh, max: 120 })}
        {field("deadline", f.deadline, { type: "date" })}
      </div>
      <div>
        {area("contact", f.contact, 3, 200)}
        <p className="microcopy">{f.contactHint}</p>
      </div>
      {field("contact_email", f.contactEmail, { type: "email" })}
      <label className="text-sm flex items-start gap-2">
        <input
          type="checkbox"
          name="paperwork"
          defaultChecked={initial?.paperwork ?? true}
          className="mt-1 shrink-0"
        />
        {f.paperwork}
      </label>
      {error && (
        <p role="alert" className="form-status auth-error">
          {error}
        </p>
      )}
      <div className="cv-actions">
        <Button variant="notice" type="submit" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {initial ? f.update : f.publish}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          {f.cancel}
        </Button>
      </div>
    </form>
  );
}

type Applicant = Tables<"applications"> & { cv: Cv; email: string };

function Applicants({ internship, back }: { internship: Internship; back: () => void }) {
  const t = useT();
  const c = t.company;
  const [applicants, setApplicants] = useState<Applicant[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<Applicant | null>(null);

  useEffect(() => {
    void (async () => {
      const apps = await supabase
        .from("applications")
        .select("*")
        .eq("internship_id", internship.id)
        .order("created_at");
      if (apps.error) return setFailed(true);
      const ids = (apps.data ?? []).map((a) => a.student_id);
      const [cvs, profiles] = ids.length
        ? await Promise.all([
            supabase.from("student_cvs").select("*").in("user_id", ids),
            supabase.from("profiles").select("id, email").in("id", ids),
          ])
        : [
            { data: [], error: null },
            { data: [], error: null },
          ];
      if (cvs.error || profiles.error) return setFailed(true);
      const cvBy = new Map((cvs.data ?? []).map((row) => [row.user_id, row]));
      const emailBy = new Map((profiles.data ?? []).map((p) => [p.id, p.email]));
      setApplicants(
        (apps.data ?? []).flatMap((a) => {
          const row = cvBy.get(a.student_id);
          if (!row) return [];
          const { user_id: _u, updated_at: _t, ...cv } = row;
          return [
            {
              ...a,
              cv: { ...cv, gpa: cv.gpa == null ? null : Number(cv.gpa) },
              email: emailBy.get(a.student_id) ?? "",
            },
          ];
        }),
      );
    })();
  }, [internship.id]);

  async function setStatus(a: Applicant, status: string) {
    setApplicants((list) => list?.map((x) => (x.id === a.id ? { ...x, status } : x)) ?? null);
    await supabase.from("applications").update({ status }).eq("id", a.id);
  }
  function view(a: Applicant) {
    setOpen(a);
    if (a.status === "Sent") void setStatus(a, "Viewed");
  }

  const ranked = applicants ? rankApplicants(applicants, internship) : [];
  const top = ranked.slice(0, 3);

  return (
    <div className="applicants">
      <button type="button" className="back-link" onClick={back}>
        <ArrowLeft size={16} />
        {c.back}
      </button>
      <h2 className="section-heading">{internship.title}</h2>
      {failed ? (
        <p className="dash-loading">{t.dash.loadFailed}</p>
      ) : !applicants ? (
        <p className="dash-loading">
          <Loader2 className="animate-spin" />
          {t.dash.loading}
        </p>
      ) : (
        <>
          <div className="stat-tiles">
            <div className="soft-card stat-tile">
              <span className="label">{c.total}</span>
              <strong>{applicants.length}</strong>
            </div>
            {pilotRules.applicationStatuses.map((s) => (
              <div key={s} className="soft-card stat-tile">
                <span className="label">{t.status[s]}</span>
                <strong>{applicants.filter((a) => a.status === s).length}</strong>
              </div>
            ))}
          </div>
          {applicants.length === 0 ? (
            <p className="dash-empty">{c.noApplicants}</p>
          ) : (
            <>
              <h3 className="sub-heading">
                <Trophy size={20} />
                {c.top3}
              </h3>
              <p className="microcopy">{c.top3Hint}</p>
              <div className="top-grid">
                {top.map((a, idx) => (
                  <article key={a.id} className="soft-card top-card">
                    <span className="top-rank">#{idx + 1}</span>
                    <h4>{a.cv.full_name}</h4>
                    <p className="job-company">
                      {[a.cv.program, a.cv.year ? t.student.cvSections.year(a.cv.year) : ""]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <div className="score-bar" aria-label={`${c.score} ${a.score}/100`}>
                      <span style={{ width: `${a.score}%` }} />
                    </div>
                    <p className="label">
                      {c.score}: {a.score}/100
                    </p>
                    <div className="tags">
                      {a.matched.length ? (
                        a.matched.map((m) => <span key={m}>{m}</span>)
                      ) : (
                        <span>{c.noMatches}</span>
                      )}
                    </div>
                    <Button
                      variant="ink"
                      size="sm"
                      className="rounded-full"
                      onClick={() => view(a)}
                    >
                      <Eye />
                      {c.viewCv}
                    </Button>
                  </article>
                ))}
              </div>
              <h3 className="sub-heading">
                <Users size={20} />
                {c.applicants}
              </h3>
              <div className="soft-card app-list">
                {ranked.map((a) => (
                  <div key={a.id} className="app-row applicant-row">
                    <span>
                      <strong>{a.cv.full_name}</strong>
                      <span className="job-company"> · {a.email}</span>
                      <span className="job-company block">
                        {c.applied} {new Date(a.created_at).toLocaleDateString()} · {c.score}{" "}
                        {a.score}
                      </span>
                    </span>
                    <span className="applicant-actions">
                      <select
                        aria-label={c.statusLabel}
                        value={a.status}
                        onChange={(e) => void setStatus(a, e.target.value)}
                      >
                        {pilotRules.applicationStatuses.map((s) => (
                          <option key={s} value={s}>
                            {t.status[s]}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => view(a)}
                      >
                        <Eye />
                        {c.viewCv}
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="notice-dialog cv-dialog">
          <DialogTitle className="sr-only">{open?.cv.full_name}</DialogTitle>
          <DialogDescription className="sr-only">{internship.title}</DialogDescription>
          {open && <CvDocument cv={open.cv} email={open.email} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
