import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, Languages, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang, useSetLang, useT } from "@/lib/i18n";
import { track } from "@/lib/landing-analytics";
import { dashboardPath, useAuth } from "@/lib/use-auth";

export function LangSwitch() {
  const lang = useLang();
  const setLang = useSetLang();
  const t = useT();
  const next = lang === "ru" ? "en" : "ru";
  return (
    <button
      type="button"
      className="lang-switch"
      aria-label={t.langButtonLabel}
      onClick={() => {
        track("lang_switch", { from: lang, to: next });
        setLang(next);
      }}
    >
      <Languages size={16} aria-hidden="true" />
      {t.langButton}
    </button>
  );
}

const studentTabs = ["companies", "applications", "cv"] as const;

// Students navigate their dashboard from the header: catalogue, applications, CV.
function StudentLinks() {
  const t = useT();
  const location = useRouterState({ select: (s) => s.location });
  const current =
    location.pathname === "/student"
      ? ((location.search as { tab?: string }).tab ?? "companies")
      : null;
  return (
    <>
      {studentTabs.map((tab) => (
        <Link
          key={tab}
          to="/student"
          search={tab === "companies" ? {} : { tab }}
          className="header-link"
          aria-current={current === tab ? "page" : undefined}
        >
          {t.student.tabs[tab]}
        </Link>
      ))}
    </>
  );
}

function AccountLinks() {
  const t = useT();
  const { loading, session, profile } = useAuth();
  const navigate = useNavigate();
  if (loading) return null;
  if (!session || !profile)
    return (
      <Link to="/auth" search={{ mode: "signin" }} className="header-link">
        {t.nav.signIn}
      </Link>
    );
  return (
    <>
      {profile.role === "student" ? (
        <StudentLinks />
      ) : (
        <Link to={dashboardPath(profile.role)} className="header-link">
          {t.nav.dashboard}
        </Link>
      )}
      <button
        type="button"
        className="header-link icon-only"
        aria-label={t.nav.signOut}
        title={t.nav.signOut}
        onClick={async () => {
          await supabase.auth.signOut();
          void navigate({ to: "/", search: { view: profile.role } });
        }}
      >
        <LogOut size={18} />
      </button>
    </>
  );
}

export function SiteHeader({ children }: { children?: ReactNode }) {
  const t = useT();
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link to="/" search={{ view: "student" }} className="brand" aria-label={t.nav.home}>
          <span className="brand-icon">
            <GraduationCap size={20} />
          </span>
          InternShip
        </Link>
        {children}
        <nav className="header-actions">
          <LangSwitch />
          <AccountLinks />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div className="brand">
          InternShip <ArrowRight size={20} />
        </div>
        <div className="footer-team">
          <div className="label">{t.landing.footerTeam}</div>
          <div className="footer-names">{t.team.members.map(([name]) => name).join(" · ")}</div>
        </div>
        <div className="label">{t.landing.footerPlace}</div>
        <div className="label">© 2026 InternShip · {t.team.name}</div>
      </div>
    </footer>
  );
}
