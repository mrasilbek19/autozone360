# Reusable Codex prompts

## Current scope override — ER Phase 1

The historical prompts below are reference material, not instructions to start more work. Property → Product and USER/ADMIN/SHOP data migration are now implemented in source. Keep schemas in `src/schemas` and app paths `gamenix-api` / `gamenix-batch`. Preserve `getAgents`, `AgentsInquiry` and `availableAgentSorts` names.

Phase 1 ER definitions are complete, including EventParticipant schema/object/input/update DTOs, REGISTERED / CANCELLED enum and unique event/member index. Read the current handoff sections and wait for a new approved task; do not repeat the completed definitions. Registration/re-registration policy remains future work. Do not add order/event services, checkout, inventory deduction, auth rewrites, socket features or frontend work without a new approval. New Order/OrderItem/Event definitions do not establish available operations. See COMPLETED_TASKS for current checks and files.

## Historical snapshot — retained for migration history

The following records describe earlier repository states and proposals. Current status and accepted decisions above take precedence. Earlier validation records remain historical.

Snapshot: 2026-10-09 (Asia/Seoul). These prompts are derived from the current user's instructions and repository findings; they are not transcripts of earlier sessions.

## Required preamble for every prompt below

> Read AGENTS.md and docs/ai/BACKEND_MIGRATION.md, DECISIONS.md, COMPLETED_TASKS.md and NEXT_STEPS.md first. Analyze actual code before editing. Preserve working functionality and the existing NestJS resolver/service/module DI patterns; make only minimal necessary changes. Distinguish target requirements, proposals, source presence and validated behavior. Use the renamed app paths apps/gamenix-api and apps/gamenix-batch; keep the existing internal structure. Update handoff docs after major work and add focused tests when behavior changes. Do not claim validation passed unless it ran successfully. Do not run migrations, install dependencies, or make unrelated configuration changes without task authorization.

Apply that preamble to each reusable task below.

## Continue backend migration

> Continue Nestar → Gamenix from the highest-priority unfinished task. Inspect both apps and their shared imports before selecting one coherent migration increment. Use USER/SHOP/ADMIN, SHOP-owned products and the ten documented gaming categories. Reconcile app/schema paths and compatibility decisions before dependent edits. Preserve community modules. Report exact changes, remaining gaps and executed validation results.

## Find legacy real-estate references

> Audit tracked application/configuration files with rg for Nestar, Property/property, AGENT/agent, housing fields, group enum values, collection joins, notification refs and batch rankings. Classify domain references versus valid generic programming terminology. Propose a coordinated removal map, then make the minimal changes within the requested scope. Preserve working queries and record client/data compatibility implications; do not blindly replace every occurrence.

## Review product contracts and filters

> Review catalog GraphQL operations, DTO input/update/output types, registered enums, schemas, services, query filters and sort allowlists for consistency. At this snapshot products are not implemented, so report that before reviewing the property starting point. Check category completeness, price/stock validation, nullable fields, removed real-estate fields, pagination and multi-shop index behavior. Fix only confirmed inconsistencies within scope and add focused behavioral tests.

## Review SHOP ownership and permissions

> Review signup, self-update, admin update, role guards, JWT claims and catalog owner predicates. Verify only SHOP can create products, owner IDs come from authenticated context, ordinary writes cannot modify another shop's products, and USER/ADMIN permissions follow the approved policy. Investigate caller-controlled memberType/memberStatus and RolesGuard null handling. Make minimal fixes and test privilege escalation, invalid auth and cross-shop writes.

## Review single-shop orders

> Inspect actual order/order-item implementation first; if absent, say so and define the smallest contract consistent with DECISIONS before implementing authorized scope. Verify every product is resolved server-side, all items have the same SHOP owner, quantities are positive integers, and prices/totals are authoritative. Test mixed shops, duplicate lines, missing/inactive products, retries and failure consistency. Do not invent a payment integration.

## Review product stock

> Inspect productLeftCount and order lifecycle code. Review nonnegative integer validation, race-safe conditional stock decrement, multi-product atomicity, idempotent retries and agreed cancellation/restock rules. Identify transaction/topology requirements before assuming transactions work. Make minimal fixes and add concurrent checkout and partial-failure tests that expose overselling or lost stock.

## Implement tournaments and giveaways

> Inspect existing event-related code; record missing modules honestly. Implement the approved tournament/giveaway increment using existing NestJS module/resolver/service and DTO/enum/schema conventions. Enforce SHOP organizer ownership and USER registration policy. Resolve any required lifecycle/eligibility/capacity/winner-selection decisions before dependent implementation. Preserve community functionality and test ownership and allowed transitions.

## Review registration and duplicate prevention

> Inspect participant schema/indexes, registration service and resolver auth. Verify one registration per member/event under concurrent requests, authenticated identity rather than caller-selected member ID, event eligibility and approved capacity/deadline/cancellation behavior. Use database uniqueness with clear duplicate error handling where appropriate. Make minimal changes and test duplicate races and agreed re-registration semantics.

## Migrate Next.js components

> Read docs/ai/FRONTEND_MIGRATION.md and locate the actual frontend checkout first; this backend snapshot contains no verified Next.js source. Audit its router, GraphQL client, types, auth, styling and reusable listing/detail/profile/form components. Migrate one approved phase using existing components, gaming terminology and actual product/SHOP API contracts. Do not invent routes or select replacement libraries without inspecting the project. Preserve community and auth flows and run the frontend's real validation scripts.

## Debug GraphQL without unrelated refactoring

> Reproduce the supplied GraphQL failure using the exact operation, variables and relevant error. Trace resolver → guards → input validation → service → schema/model, comparing the current code-first contract and actual app paths. Make the smallest root-cause fix; preserve unrelated operations, module architecture and behavior. Add a focused regression test and report any runtime prerequisites or unverified assumptions.

## Review WebSocket chat

> Inspect socket gateway, adapter, auth handshake and any client protocol. This snapshot uses NestJS WsAdapter/ws, Guest-capable global broadcast and five in-memory messages. Review URL-token logging, invalid authentication, authorized conversation membership/routing, payload validation, history and reconnect behavior against the approved customer/shop chat requirements. Make focused changes; test that nonparticipants cannot receive private messages. Do not assume Socket.IO or persistent conversations already exist.

## Validate backend after changes

> Read actual nest-cli/package/tsconfig paths before validation. Run npx tsc -p apps/gamenix-api/tsconfig.app.json --noEmit, npx tsc -p apps/gamenix-batch/tsconfig.app.json --noEmit, and npm run build. Check configuration paths if an older checkout still uses Nestar. Explicitly build batch when batch changes require it because the current default build targets API. Run focused changed-behavior tests, record exact exit results, and mark unavailable checks NOT VERIFIED. Do not use npm run lint unless rewriting is acceptable: it uses --fix.

## Documentation-only handoff refresh

> Inspect actual repository state and available session evidence, then update only the six files in docs/ai. Do not modify source/configuration, install dependencies, rename apps, run migrations or claim unexecuted validation. Preserve the distinction between existing source functionality and work completed in this session. Document unresolved decisions and keep the six files consistent.
