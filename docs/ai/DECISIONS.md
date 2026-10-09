# Architectural decisions

## Latest constraint — preserve all production guards, 2026-10-09

The user's latest instruction supersedes the previously approved RolesGuard adjustment. Restore RolesGuard unchanged and remove its now-unused Member-model registration/export from AuthModule. Preserve the service signup/self-update changes and existing PENDING enum addition. Do not replace the removed authorization logic elsewhere without further direction.

Consequence: existing JWT role checks do not enforce PENDING SHOP restrictions or reload current database status. This remains unresolved; earlier current-state guard-enforcement decisions below describe the superseded implementation. Production guard files and AuthModule now match HEAD.

## Earlier records — latest correction takes precedence

## Current accepted decision — minimal SHOP approval, 2026-10-09

The user approved the revised minimal file list. This supersedes the earlier broader Phase 2 authentication/upload plan.

- Keep existing signup/login, bcrypt, JWT structure/signing/verification, AuthService, AuthGuard, decorators, MemberInput/MemberUpdate and resolvers. USER registration/login retain existing behavior.
- Preserve the user's PENDING enum addition. New SHOP signup sets PENDING; public ADMIN signup is rejected. Do not create application collections or require a new picture/upload argument.
- Reuse getAllMembersByAdmin with SHOP/PENDING filters and updateMemberByAdmin with memberStatus ACTIVE. Existing ADMIN metadata and trusted member management remain; no new operations or DTOs.
- Make the smallest necessary RolesGuard change: after existing JWT verification, load the current Member and check its current role. SHOP and ADMIN require ACTIVE. Other USER status behavior remains as before. AuthModule makes the existing Member model available to the guard without changing AuthService or creating a MemberService dependency cycle.
- Prevent self-service memberType/memberStatus updates in MemberService, because those fields would permit self-approval or ADMIN promotion. Keep DTO fields for existing trusted ADMIN updates; do not split DTOs or refactor other fields.
- Preserve all upload code. No HTTP upload endpoint was found; do not invent one or claim the Axios flow works. Existing ACTIVE-only profile updates remain unchanged, including for pending applicants.

Still pending: locating/verifying the stated HTTP uploader and its pending-shop image persistence behavior, live client/data compatibility, and any separately approved order/event/chat/frontend work. No further phase is authorized by this increment. Earlier Phase 1 decisions remain below as history.

## Earlier phase records

## Current accepted decisions — ER Phase 1, 2026-10-09

These decisions supersede conflicting proposals in the historical record below.

- Preserve `gamenix-api` / `gamenix-batch`, NestJS DI and the existing module/resolver/service pattern. Keep schemas in `src/schemas` as explicitly required by the latest request; DTOs/enums remain under `src/libs`.
- Use MemberType USER / ADMIN / SHOP and `memberProducts`. Preserve `getAgents`, `AgentsInquiry` and `availableAgentSorts`; changing these names is unnecessary for this data-model migration.
- Use the exact Product fields and ten categories specified in the attached request. Remove housing fields/filters and the old unique housing index; independent shops can sell similar equipment.
- ProductStatus is PAUSE / PROCESS / FINISHED. The user explicitly approved PROCESS for active listings, FINISHED for sold listings and `deletedAt` for deletion. Default PROCESS preserves existing creation behavior. PAUSE is not deletion. Existing owner checks, counters and admin purge behavior remain, with the required status/date adaptations.
- OrderStatus is PAUSE / PROCESS / FINISHED, default PAUSE. EventType is TOURNAMENT / GIVEAWAY; EventStatus is PAUSED / PROCESS / FINISHED, default PAUSED. These are data defaults, not new lifecycle services.
- Use the ER's `order`, `orderItems` and `events` collections and exact owner/reference names. Keep customer `memberId` and event organizer internal to input assignment, following the existing catalog ownership pattern.
- Product stock is a nonnegative integer. Item quantity and event capacity are positive integers. Money fields are nonnegative numbers. No inventory deduction, totals calculation, checkout, event registration or new WebSocket functionality is authorized in Phase 1.
- ParticipantStatus values confirmed by the user: REGISTERED / CANCELLED. EventParticipant defaults to REGISTERED and uses collection `eventParticipants`, Event/Member refs and a unique `(eventId, memberId)` index across both states. Re-registration policy is deferred; cancellation does not free the unique pair. Input `memberId` is internal for future authenticated assignment; update DTO only exposes `_id` and optional status, preserving references.
- New Order/OrderItem/Event/EventParticipant definitions are not wired to application operations. Future services must enforce SHOP/customer identity, one shop per order and reference existence; refs alone provide no such checks.

Still pending: existing-data/client compatibility; shop enrollment/security policy; atomic order/inventory writes; payment, shipping, cancellation and event registration rules; private chat. No live data migration or Phase 2 work is authorized by this increment.

## Historical snapshot — retained for migration history

The following records describe earlier repository states and proposals. Current status and accepted decisions above take precedence. Earlier validation records remain historical.

Snapshot: 2026-10-09 (Asia/Seoul). Confirmed means explicitly required by the user/`AGENTS.md`, not necessarily implemented. Proposed alternatives below are tradeoffs for future review; this session did not establish a historical alternatives discussion.

## Confirmed target decisions

User naming update (2026-10-09): use **Gamenix** / `gamenix`, including `gamenix-api` and `gamenix-batch`. The project rename is completed; keep the existing directory/module structure and domain logic. This supersedes the earlier name ending in 365.

| Decision | Reason | Technical implications | Risks | Alternatives for comparison |
|---|---|---|---|---|
| Reuse Nestar architecture and preserve NestJS, GraphQL, MongoDB/Mongoose | Short timeline and reusable working features | Keep resolver/service/module DI patterns and code-first DTOs | Old domain assumptions can survive renames | Full rewrite; different persistence/API stack |
| Replace properties with gaming products | New marketplace domain | Rename catalog contracts; remove real-estate fields and filters; update joins/indexes/batch | Breaking GraphQL and stored-data changes | Parallel property/product catalogs |
| Use USER, SHOP, ADMIN; replace AGENT with independent SHOP | Separate buyers, sellers, administration | Update enums, guards, signup policy, searches, counters, token/data compatibility | Caller-controlled roles and old JWTs/data | Separate shop accounts/role system |
| Support multiple independent shops; products owned by SHOP members | Marketplace requires seller independence | Server assigns owner; enforce owner predicates on writes; revisit catalog uniqueness | Cross-shop writes and data exposure | Single central seller |
| Restrict each order to products from one shop | Clear seller responsibility per order | Validate all item owners server-side; split checkout if needed | Mixed carts and concurrent edits | Multi-shop orders with seller suborders |
| Maintain stock in `productLeftCount` | Equipment has purchasable quantities | Integer validation and conditional decrement; consistency with order lifecycle | Overselling and failed-order stock loss | Separate inventory ledger/reservation model |
| Use the ten specified product categories | Consistent gaming catalog contract | KEYBOARD, MOUSE, MONITOR, AUDIO, CHAIR, DESK, CONTROLLER, ACCESSORY, GPU, GAMING_PHONE in DTO/schema/client enums | Hardcoded taxonomy needs future evolution | Dynamic category collection |
| Support shop tournaments and giveaways | Gaming community engagement | Owned events and participant relationships | Eligibility/capacity/winner rules unspecified | Separate unrelated feature stacks |
| Prevent duplicate event registrations | One registration per member/event | Enforce uniqueness against concurrent requests, not just pre-checks | Cancellation/re-registration semantics | Allow multiple entries |
| Reuse articles, comments, likes, views, follows, auth/member modules | Preserve existing community functionality | Replace catalog-specific groups/joins while retaining community APIs | Counter/reference drift | Rebuild community separately |
| Use NestJS WebSockets for real-time customer/shop communication | Reuse existing gateway and auth integration | Add authorized conversation routing | Existing broadcast/Guest behavior is unsuitable for private messages | Polling or external chat service |
| Preserve API/batch app separation with Gamenix names | Existing monorepo responsibilities | Rename paths/config/scripts/imports together | Batch imports API models directly | Merge apps or extract shared library |

## Proposed and pending decisions

| Topic / status | Proposed direction and reason | Technical implications | Risks | Alternatives / unresolved choice |
|---|---|---|---|---|
| Schema placement — PENDING | Reconcile `AGENTS.md` target `src/libs` with existing `src/schemas` before edits | Update module and batch imports if moved | Large unnecessary path churn | Keep existing schemas path with an explicitly accepted instruction change |
| Data and GraphQL compatibility — PENDING | Inventory clients and existing data first | Map AGENT/PROPERTY values, references, collection names, deployed tokens and operations | Data loss or client breakage | Clean new database, explicit migration, temporary aliases |
| Product contract — PROPOSED | Product-prefixed names and validated category/price/stock filters | New DTOs/schema/indexes; remove housing fields | Inconsistent type/input/output fields | Final field names, status values, SKU/brand/specification model still open |
| Order consistency — PENDING | Conditional stock writes plus atomic multi-item/order strategy | May require MongoDB transactions and supported topology | Partial writes, retries, overselling | Reservations or compensating updates; choose decrement timing, idempotency, cancellation/restock rules |
| Order data — PENDING | Server-calculated totals and item snapshots for historical accuracy | Define status, quantity, currency, shipping and payment fields | Price changes and ambiguous fulfillment | Snapshot detail level, payment provider and status transitions undecided |
| Collection names — PENDING details | Use user target list as planning baseline, including singular `order` | Explicit Mongoose collection options if adopted | Naming drift | Confirm `order` versus `orders`; exact owner/reference field names |
| Registration uniqueness — PROPOSED mechanism | Unique `(eventId, memberId)` index plus service checks | Handle duplicate-key races; define eligibility | Soft deletion may block re-registration | Partial unique index or retained registration state |
| Event lifecycle — PENDING | Shared event concept with tournament/giveaway type | Define organizer, schedule, capacity and registration states | Unclear cancellation and winner selection | Separate subtype models or modules |
| Private chat — PENDING details | Authenticated participant-authorized conversations over existing `ws` adapter | Replace global routing for private messages; remove token logging | Privacy, token leakage, lost history | Persistent messages versus ephemeral chat; HTTP token/session handshake versus URL token; Guest access policy |
| Shop enrollment — PENDING | Restrict privileged role changes and explicitly define SHOP enrollment | Separate self-service fields from admin-controlled role/status | Privilege escalation or stale token roles | Open SHOP signup, approval workflow, invitation model |
| Frontend source — PENDING | Locate actual Next.js checkout before implementation | Audit router, components, GraphQL client, styling and auth | Invented paths or incompatible client assumptions | Repo location and access not provided |

No pending mechanism in this table has been implemented by this documentation task. See [BACKEND_MIGRATION.md](BACKEND_MIGRATION.md) for current source evidence.
