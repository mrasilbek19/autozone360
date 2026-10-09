# Next steps

## Latest scaffold status — 2026-10-09

EventModule and OrderModule, each with a resolver and service, are created under components and imported by ComponentsModule. Existing Event/Order schemas are registered. Both app TypeScript checks, API build, all 5 currently present tests and an offline DI smoke check pass.

These are scaffolds without GraphQL operations or business logic. Stop at the requested generation task. Future event/order behavior needs its own approved requirements; do not infer checkout, stock deduction, registration, OrderItem/EventParticipant provider wiring or ownership rules from empty services. Existing guard-preservation constraints and unresolved shop-approval enforcement remain unchanged.

## Latest state — guard changes removed, 2026-10-09

The user prohibited guard-file changes. RolesGuard and its supporting AuthModule changes have been reverted. SHOP/PENDING signup, public ADMIN rejection and self-update privilege-write rejection remain; existing ADMIN operations still update member status.

Pending task: choose an explicitly approved way to enforce active-SHOP permissions while leaving guards unchanged. No replacement was implemented. Original role-only guards permit PENDING SHOP tokens, so approval enforcement must not be marked complete. Current-database blocking/approval effects are also absent.

Both TypeScript checks, API/batch builds and all 38 tests pass. Guard tests document the original behavior and its limitation. Upload endpoint discovery remains pending. Earlier next steps and completion claims below are historical where they conflict with this correction.

## Earlier records — latest correction takes precedence

## Current next steps — minimal SHOP approval complete

The approved minimal implementation is complete: SHOP signup starts PENDING; existing ADMIN list/status-update operations support approval; RolesGuard checks current role and ACTIVE SHOP/ADMIN status; self-updates cannot alter role/status. USER signup/login, JWT/password helpers, DTOs/resolvers and upload implementation remain unchanged. Both app TypeScript checks/builds and all 44 tests pass.

Stop implementation until a new task is approved. Remaining follow-up:

- Locate the actual Axios-compatible HTTP upload endpoint. This checkout has GraphQL upload mutations and static file serving, but no HTTP POST upload handler. Do not implement a replacement automatically or mark HTTP upload validation complete.
- Confirm how a pending applicant's uploaded image path is saved: existing updateMember requires ACTIVE, and the missing HTTP endpoint may have a separate persistence path. No pending-profile/image feature was added.
- Review actual client documents and live MongoDB/index deployment before rollout. No new data migration or deployment was run. Existing SHOP accounts were not reclassified; only new signups start PENDING.
- Orders/payments/inventory, event services/registration, frontend and private chat remain separately approved future work. Do not resume the broader superseded authentication/upload proposal.

Exact file inventory, validation and limitations are in COMPLETED_TASKS. Earlier next-step records below describe prior phases and do not override this scope.

## Earlier phase records

## Current next steps — after ER Phase 1 work

1. Phase 1 ER definitions are complete: EventParticipant now has REGISTERED / CANCELLED, Event/Member refs, object/input/update DTOs and the unique `(eventId, memberId)` index. Both TypeScript checks, both builds and all 20 tests pass. No further implementation is authorized in this phase.
2. Review existing-data and frontend compatibility before deployment: AGENT → SHOP, Property → Product fields/collections/GraphQL contracts, member counters and PRODUCT group/reference values. Do not execute a live migration automatically.
3. Stop after Phase 1. Obtain explicit approval before order, checkout, inventory, payment, event/registration services or frontend changes.
4. In a later approved phase, wire Order/OrderItem/Event/Participant models and operations using existing Nest patterns. Enforce authenticated ownership, SHOP organizers and single-shop orders; calculate totals server-side and choose atomic inventory/idempotency/cancellation rules. Existing DTOs are data definitions, not trusted checkout commands.
5. Later address known auth/self-update role risks, guard null handling, counter atomicity and private socket authorization separately. They were deliberately preserved in this phase.

The product catalog rename, member roles/counters, housing-filter removal and dependent community/batch references are implemented; do not repeat the historical rename tasks below. Keep `getAgents`, `AgentsInquiry`, `availableAgentSorts` and agent-named shop ranking methods unless a later task explicitly approves their rename. Schema placement is settled for this phase: `src/schemas`.

See [COMPLETED_TASKS.md](COMPLETED_TASKS.md) for exact validation and file inventory. No Phase 2 work has started.

## Historical snapshot — retained for migration history

The following records describe earlier repository states and proposals. Current status and accepted decisions above take precedence. Earlier validation records remain historical.

Snapshot: 2026-10-09 (Asia/Seoul). Remaining implementation tasks below are PLANNED; the project naming/configuration rename is COMPLETED. See [COMPLETED_TASKS.md](COMPLETED_TASKS.md) for current validation limits.

## Priority and dependency order

1. P0: resolve contracts/compatibility and privileged member-field handling; locate frontend.
2. P1: coordinate app/role/catalog migration across API, batch, schemas and community references.
3. P1: validate the reusable product/shop foundation; migrate frontend catalog/shop UI against the actual contract.
4. P2: implement atomic inventory/orders, then checkout/order UI.
5. P2: implement events/participants, then event UI.
6. P2: authorize private customer/shop conversations, then chat UI.

Reuse existing auth/member/catalog/community/layout patterns. Avoid unrelated rewrites to keep the short timeline achievable.

## Backend cleanup

| Priority | Task | Completion evidence |
|---|---|---|
| P0 | Decide existing-data/client compatibility, schema placement, shop enrollment, product fields/statuses, and exact owner/collection names | Accepted decisions recorded before dependent code/data changes |
| P0 | Restrict signup/self-update role/status writes; review token role freshness and RolesGuard null handling | Focused privilege-escalation and invalid-token tests |
| COMPLETED | Project naming/configuration rename to Gamenix; preserve internal structure and logic | See COMPLETED_TASKS for validation results |
| P1 | Replace property module/classes/DTOs/enums/schema with products; use all ten categories | Consistent GraphQL inputs/outputs, model, validation and service fields |
| P1 | Replace agent role/inquiries/search/counters with SHOP equivalents; preserve USER/ADMIN behavior | Shop-only creation and owner-restricted updates, admin tests |
| P1 | Replace housing filters and sort/options allowlists; review unique index for multiple shops | Category/text/price/shop filtering works; similar products can belong to different shops |
| P1 | Remove catalog-specific legacy names from likes/views/comments/groups/joins, notification refs and batch rankings | Source audit plus community regression checks |
| P1 | Verify status timestamp persistence and counters during transitions | Focused transition tests; no counter drift |
| P2 | Implement productLeftCount and order/orderItems with one shop per order | Quantity/owner/availability/price validation; race-safe stock and consistent multi-item writes |
| P2 | Define idempotency, payment/shipping/status, cancellation/restock and atomicity strategy | Approved lifecycle contract and failure-path tests |
| P2 | Implement owned tournament/giveaway events and participants | Registration eligibility, unique member/event constraint, duplicate-race tests |
| P2 | Review socket auth; remove token logging; define authorized conversations and history | Participant-only routing, guest policy, payload/reconnect tests |

Do not remove ordinary identifier words such as JavaScript “property” blindly; audit domain references and preserve valid language/API usage. Do not execute database migrations without a reviewed plan for real data.

## Frontend migration

| Priority | Task | Dependency |
|---|---|---|
| P0 | Locate Next.js repo; inventory actual pages/components/client/types/style/auth | Frontend currently unavailable in this checkout |
| P1 | Update branding/navigation and reuse shared layout/components | Frontend baseline established |
| P1 | Migrate property cards/list/detail/filter UI into product components and GraphQL documents/types | Approved and implemented product contract |
| P1 | Migrate agent pages to shop profiles and owned product management | SHOP permissions and shop queries |
| P1 | Preserve articles/comments/likes/views/follows and account flows | Community contract compatibility |
| P2 | Add single-shop cart, checkout and order history/detail | Atomic order and stock APIs plus lifecycle decisions |
| P2 | Add event list/detail/management/registration | Event and participant APIs |
| P2 | Integrate private customer/shop chat | Authorized backend conversation protocol |

Full phases and conceptual mappings: [FRONTEND_MIGRATION.md](FRONTEND_MIGRATION.md). Replace mappings with real paths after frontend inspection.

## Testing

1. Establish baseline on the actual current app paths before future code edits, using installed tooling only. Avoid treating missing target paths as source compilation failures.
2. For the renamed apps, run the mandated checks:

   ```bash
   npx tsc -p apps/gamenix-api/tsconfig.app.json --noEmit
   npx tsc -p apps/gamenix-batch/tsconfig.app.json --noEmit
   npm run build
   ```

   App paths now use `gamenix-api` and `gamenix-batch`. Record which paths were tested. `npm run build` currently builds the default API project; explicitly build batch as well when batch code changes.

3. Add focused GraphQL input/output/filter and query/mutation tests as contracts change.
4. Test USER/SHOP/ADMIN role restrictions, self-service privileged fields, owner spoofing and cross-shop updates.
5. Test invalid quantities, mixed-shop orders, unavailable products, insufficient stock, concurrent checkout, retries, partial failure and the agreed cancellation/restock behavior.
6. Test event ownership, duplicate/concurrent registration, eligibility and the agreed capacity/deadline/cancellation rules.
7. Test WebSocket valid/invalid auth, guest policy, unauthorized conversation access, routing, malformed messages and reconnect/history behavior.
8. Run community regression checks and actual frontend checks once available. Update stale greeting-only e2e assertions when appropriate; record exact results.

No tests were run in the documentation session. `npm run lint` rewrites files with `--fix`; choose a non-mutating lint invocation when rewriting is outside the task scope.

## Documentation

- Keep all six handoff files synchronized after each major implementation increment.
- Record exact files changed and validation commands/results in COMPLETED_TASKS; distinguish inherited source from session work.
- Update DECISIONS when pending questions are resolved; do not silently turn proposals into accepted decisions.
- Record unresolved blockers: unavailable frontend, unknown live data/client deployment, transaction topology, payment/shipping rules, event lifecycle and chat policy.
- Revise backend/frontend operation mappings to the actual implemented names and retire superseded proposals.
