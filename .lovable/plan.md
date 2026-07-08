## Goal
Replace every remaining "toast-only" or shortcut action across the app with a proper multi-step production flow (amount entry → method → review → confirm → processing → success/failure), using the same reusable primitives everywhere.

## Shared primitives (build once, reuse)
Create `src/components/flow/` with:
- `MultiStepDialog.tsx` — headless dialog shell: `steps`, `currentStep`, progress bar (dots + labels), back/next/close, RTL-aware, keyboard esc/enter, disables close during `processing`.
- `ProcessingStep.tsx` — animated spinner + "جارٍ المعالجة..." with simulated latency (900–1500ms) that can resolve success or failure (10% mocked failure toggle for realism, seeded so retries succeed).
- `SuccessStep.tsx` / `FailureStep.tsx` — icon, title, message, primary + secondary actions (Retry on failure).
- `ReviewRow.tsx` — label/value row used in review step.
- `PaymentMethodPicker.tsx` — Vodafone Cash / Instapay / بطاقة بنكية / Fawry, with per-method account/card fields + inline validation (Zod).
- `AmountInput.tsx` — large numeric input with currency suffix, quick-pick chips (500/1000/5000/10000), min/max validation.
- `useMockProcess.ts` — hook that returns `{ run, status, error, reset }` for the processing state machine.

## Flows to convert (all currently toast-only or one-shot)

### User portal
1. **Wallet — Deposit**: Amount → Method (Vodafone/Instapay/Card/Fawry) → Review → Processing → Success (updates balance + prepends tx) / Failure (retry).
2. **Wallet — Withdraw**: Amount (with available-balance check) → Bank/Wallet destination → Review with fee breakdown → Processing → Success (pending withdrawal added) / Failure.
3. **My Listings — Boost**: Package pick (3/7/30 days) → Payment method → Review → Processing → Success (badge on listing).
4. **My Listings — Edit**: Replaces stub `Pencil` toast — opens ListingWizard prefilled, save with processing state.
5. **My Listings — Delete**: AlertDialog with typed confirmation ("احذف") → Processing → Success (removed from list).
6. **Favorites — Remove / Contact seller**: confirm dialog / contact multi-step (message template → send → sent).
7. **Import Requests — New request**: multi-step (car specs → budget → shipping port → review → submit → tracking id).
8. **Chat — Send offer / Report / Block**: proper dialogs (offer amount + message → review → send; report reason → details → submit; block confirm).
9. **Profile — Change avatar / password**: multi-step change password (current → new → confirm → processing → success).
10. **Settings — Delete account / Export data / Change email/phone**: full destructive flow with typed confirmation + OTP mock step.
11. **Listing detail — Contact seller / Start escrow / Report**: multi-step contact and escrow init (price agreement → deposit method → review → processing → escrow created).

### Agency portal
12. **Tokens — Purchase**: already has dialog; upgrade to steps (package → method → review → processing → success + updated balance/history).
13. **Bids — Submit**: current dialog → convert to steps (specs → price+delivery+warranty → review → processing → success with token deduction).
14. **Inventory — Add / Edit / Delete**: multi-step Add (basics → specs → pricing → images → review → save); Delete typed confirmation.
15. **Add-Listing wizard**: add final Review + Processing + Success step (currently jumps straight to toast+nav).
16. **Public Listings — Boost / Pause / Unpublish / Delete**: proper dialogs each.
17. **Chat (agency) — same upgrades as user chat.**

### Admin portal
18. **Users — Add user / Suspend / Verify / Delete / Reset password**: Add already dialog → add review+processing; suspend/verify/delete → confirmation with reason + processing.
19. **Agencies — Approve / Reject / Suspend**: approve with review (commission %, tier), reject with reason category + details.
20. **Disputes — Resolve / Escalate / Refund / Release**: resolve → outcome pick (refund buyer / release seller / split) → amount split → notes → review → processing.
21. **Financial — Approve/Reject withdrawal**: multi-step (verify amount → payment reference → review → processing → success).
22. **Listings review — Approve / Reject / Request edits**: proper reason + processing steps.
23. **Profile — same password/email/2FA multi-step as user.**

### Global
24. **Login** — add "Processing" step between submit and redirect, plus mock 2FA OTP step for admin role.
25. **Logout** — confirm dialog before clearing store.
26. **Language / Currency / Theme toggles** — keep instant (correct UX), no change.
27. **Notifications popover** — add "Mark all read / Clear all" with confirm; clicking a notification opens a detail sheet with action buttons that route into the right flow.

## Delivery order (single pass, no polishing loops)
1. Build shared `flow/` primitives + `useMockProcess`.
2. Wallet (deposit + withdraw) as the reference implementation.
3. Sweep User → Agency → Admin, converting each action list above using the primitives.
4. Login/Logout + Notifications polish.
5. Run `tsgo` and verify build clean; spot-check 2–3 flows in the preview.

## Non-goals
- No backend wiring (all mocked via `useMockProcess`).
- No visual redesign — reuse existing tokens, shadcn components, RTL layout.
- No new routes; only new dialogs/components + edits to existing route files.

## Technical notes
- All new flow state stays local to the triggering component; success handlers call the existing TanStack Query mutations from `src/hooks/queries.ts` so cache stays coherent.
- Failure step uses a `Math.random() < 0.1` mock but respects a `forceSuccess` prop so retries always succeed → user never gets stuck.
- All copy in Arabic with EN keys added to `src/lib/i18n.ts` for the toggles that already exist; where an EN key is missing, fall back to the AR string (no regressions).
- Zod schemas colocated with each flow component.

This is a large single pass across ~25 flows; expect a broad diff touching most route files and adding ~8 new components under `src/components/flow/`.