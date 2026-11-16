import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Building2, CheckCircle2, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { supabase } from "@/integrations/supabase/client";
import { useLang, useT } from "@/lib/i18n";
import { track } from "@/lib/landing-analytics";
import { dashboardPath, isNarxozEmail, useAuth, type Role } from "@/lib/use-auth";

type Mode = "signin" | "signup" | "reset" | "update";
const modes: Mode[] = ["signin", "signup", "reset", "update"];

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: Mode; role?: Role } => ({
    ...(modes.includes(search["mode"] as Mode) ? { mode: search["mode"] as Mode } : {}),
    ...(search["role"] === "company" || search["role"] === "student"
      ? { role: search["role"] as Role }
      : {}),
  }),
  head: () => ({ meta: [{ title: "InternShip — Sign in" }] }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}

function AuthPage() {
  const search = Route.useSearch();
  const mode = search.mode ?? "signin";
  const role = search.role ?? "student";
  const t = useT();
  const a = t.auth;
  const lang = useLang();
  const navigate = useNavigate();
  const { loading, session, profile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Signed-in users go straight to their dashboard (except while setting a new password).
  useEffect(() => {
    if (!loading && session && profile && mode !== "update")
      void navigate({ to: dashboardPath(profile.role), replace: true });
  }, [loading, session, profile, mode, navigate]);

  const redirectTo = (path: string) =>
    `${window.location.origin}${path}${path.includes("?") ? "&" : "?"}lang=${lang}`;

  function setMode(next: Mode, nextRole: Role = role) {
    setError("");
    setNotice("");
    void navigate({ to: "/auth", search: { mode: next, role: nextRole }, replace: true });
  }

  function explain(message: string) {
    if (/invalid login credentials/i.test(message)) return a.wrongCredentials;
    if (/email not confirmed/i.test(message)) return a.notConfirmed;
    if (/already registered|already been registered/i.test(message)) return a.alreadyRegistered;
    if (/narxoz/i.test(message)) return a.narxozOnly;
    if (/password/i.test(message) && /least|short/i.test(message)) return a.shortPassword;
    return a.genericError;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    const cleanEmail = email.trim().toLowerCase();
    if (mode !== "update" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      return setError(a.invalidEmail);
    if ((mode === "signup" || mode === "update") && password.length < 8)
      return setError(a.shortPassword);
    if (mode === "signup" && role === "student" && !isNarxozEmail(cleanEmail))
      return setError(a.narxozOnly);
    if (mode === "signup" && !name.trim()) return setError(a.nameRequired);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (err) return setError(explain(err.message));
        track("account_sign_in", { method: "password" });
      } else if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: redirectTo("/auth"),
            data: { role, full_name: name.trim() },
          },
        });
        if (err) return setError(explain(err.message));
        // Supabase hides existing accounts behind a fake success with no identities.
        if (data.user && data.user.identities?.length === 0) return setError(a.alreadyRegistered);
        track("account_sign_up", { role, method: "password" });
        if (!data.session) setNotice(a.checkEmail);
      } else if (mode === "reset") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: redirectTo("/auth?mode=update"),
        });
        if (err) return setError(explain(err.message));
        setNotice(a.resetSent);
      } else {
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) return setError(explain(err.message));
        setNotice(a.passwordSaved);
        setMode("signin");
      }
    } catch {
      setError(a.genericError);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError("");
    track("account_sign_in", { method: "google" });
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo("/auth") },
    });
    if (err) setError(a.genericError);
  }

  const title =
    mode === "signup"
      ? a.titleSignUp
      : mode === "reset"
        ? a.titleReset
        : mode === "update"
          ? a.titleUpdate
          : a.titleSignIn;
  const showGoogle =
    (mode === "signin" || mode === "signup") && (mode === "signin" || role === "company");

  return (
    <>
      <SiteHeader />
      <div className="wrap auth-page">
        <div className="soft-card auth-card">
          <h1 className="auth-title">{title}</h1>
          {mode === "signup" && (
            <div className="segmented auth-roles" role="group" aria-label={a.roleGroup}>
              {(["student", "company"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={role === r}
                  onClick={() => setMode("signup", r)}
                >
                  {r === "student" ? <GraduationCap size={16} /> : <Building2 size={16} />}
                  {r === "student" ? a.student : a.company}
                </button>
              ))}
            </div>
          )}
          {mode === "signup" && (
            <p className="auth-hint">{role === "student" ? a.studentHint : a.companyHint}</p>
          )}

          {showGoogle && (
            <>
              <Button
                type="button"
                variant="outline"
                className="auth-google"
                onClick={() => void google()}
              >
                <GoogleIcon />
                {a.google}
              </Button>
              <div className="auth-or">
                <span>{a.or}</span>
              </div>
            </>
          )}

          <form className="listing-fields" onSubmit={submit} noValidate>
            {mode === "signup" && (
              <div>
                <label className="field-label" htmlFor="auth-name">
                  {a.fullName}
                </label>
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  maxLength={120}
                  required
                />
              </div>
            )}
            {mode !== "update" && (
              <div>
                <label className="field-label" htmlFor="auth-email">
                  {a.email}
                </label>
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder={
                    mode === "signup" && role === "student" ? "name@narxoz.kz" : undefined
                  }
                  maxLength={254}
                  required
                />
              </div>
            )}
            {mode !== "reset" && (
              <div>
                <label className="field-label" htmlFor="auth-password">
                  {mode === "update" ? a.newPassword : a.password}
                </label>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  minLength={mode === "signin" ? undefined : 8}
                  required
                />
                {mode !== "signin" && <p className="microcopy">{a.passwordHint}</p>}
              </div>
            )}
            {error && (
              <p role="alert" className="form-status auth-error">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="form-status success">
                <CheckCircle2 className="inline mr-1" size={16} />
                {notice}
              </p>
            )}
            <Button variant="notice" type="submit" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              {mode === "signup"
                ? a.submitSignUp
                : mode === "reset"
                  ? a.submitReset
                  : mode === "update"
                    ? a.submitUpdate
                    : a.submitSignIn}
              <ArrowRight />
            </Button>
          </form>

          <div className="auth-links">
            {mode === "signin" && (
              <>
                <button type="button" onClick={() => setMode("signup")}>
                  {a.toSignUp}
                </button>
                <button type="button" onClick={() => setMode("reset")}>
                  {a.forgot}
                </button>
              </>
            )}
            {mode !== "signin" && (
              <button type="button" onClick={() => setMode("signin")}>
                {a.toSignIn}
              </button>
            )}
          </div>
        </div>
        <p className="auth-back">
          <Link to="/" search={{ view: role }}>
            ← InternShip
          </Link>
        </p>
      </div>
      <SiteFooter />
    </>
  );
}
