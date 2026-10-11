<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## App architecture
- Keep the landing experience at `/` with a validated `view` search parameter; this preserves SSR and shareable audience links without duplicate content routes.
- Keep copy and business rules in a browser-safe content module, previews and forms in separate components; this lets both audiences use one accessible page structure.
- Store pilot interest through a validated public server function using insert-only RLS, never expose lead reads; this permits signup without accounts while protecting personal details.
- Append anonymous analytics to Cloud and a browser dataLayer, excluding email and personal details; this supports downstream analytics without collecting lead data twice.
- Call requests are unconfirmed until arranged by the team; emit call_requested, not call_booked, until a real booking service exists.
