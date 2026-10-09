# Architectural decisions

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
