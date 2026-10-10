# Completed tasks and evidence ledger

## Events and EventParticipant operations — 2026-10-10

COMPLETED after approval of the Events proposal and eventStart deadline clarification. Working tree was clean before this increment. Auth/guards, ProductService, OrderService, MemberService and community code are unchanged.

Modified source files, relative to apps/gamenix-api/src:

- components/event/event.module.ts: register existing EventParticipant/Member models and import AuthModule.
- components/event/event.resolver.ts: 6 queries and 9 mutations, existing role decorators and AuthMember identity.
- components/event/event.service.ts: SHOP management, public/owner/admin queries, USER applications/cancellation/history, SHOP/ADMIN review, current-member authorization and transactional capacity coordination.
- libs/dto/event/event.input.ts: nested filters, pagination, sorting and shop/admin includeDeleted inquiries; organizer stays internal.
- libs/dto/event/event.ts: nullable deletedAt and Events list/metaCounter wrapper.
- libs/dto/event-participant/event-participant.input.ts: registration exposes eventId only; add participant inquiries and nested status/event filters.
- libs/dto/event-participant/event-participant.update.ts: require REGISTERED or REJECTED for review.
- libs/dto/event-participant/event-participant.ts: list/metaCounter wrapper and optional eventData/memberData history details.
- libs/enums/participant.enum.ts: add PENDING/REJECTED, preserving REGISTERED/CANCELLED.
- schemas/Event.model.ts: add deletedAt with null default; existing fields/collection remain.
- schemas/EventParticipant.model.ts: default new applications PENDING; refs and unique pair index remain.
- libs/config.ts: add availableEventSorts.

Created components/event/event.service.spec.ts with 55 offline cases covering roles, ownership, required fields/dates/capacity, lifecycle, application/review, cancellation/reapplication, duplicate errors, moderation, list pipelines, DTO/schema contracts, GraphQL generation and real module DI. Mocks test business decisions/session wiring, not MongoDB isolation.

Created components/event/event.integration.spec.ts with 5 opt-in cases for concurrent duplicates/approvals, capacity-decrease contention, rollback and actual filter/pagination/history queries. Requires EVENT_TEST_MONGO_URI pointing to a transaction-capable test server; creates and drops only a fresh gamenix_event_test_* database. Never uses the application's configured database URI.

Validation executed:

- npx tsc -p apps/gamenix-api/tsconfig.app.json --noEmit — PASS.
- npx tsc -p apps/gamenix-batch/tsconfig.app.json --noEmit — PASS.
- npm run build — PASS (API).
- ./node_modules/.bin/nest build gamenix-batch — PASS.
- ./node_modules/.bin/jest --runInBand --silent — PASS: 88 tests / 3 suites; 5 integration tests / 1 suite skipped because no dedicated URI is configured. Includes 55 event tests and 33 existing tests.
- Full offline API GraphQL schema generation — PASS: 8 resolvers / 25 queries / 33 mutations. Real EventModule DI also PASS in the event suite.
- git diff --check — PASS.

Updated all six docs/ai handoff files, preserving earlier migration history and decisions. No live DB, HTTP/e2e or image upload tests ran; concurrency/rollback/topology remain unverified against MongoDB. Event-image directory/target integration remains separate work, as described in BACKEND_MIGRATION. No data migration, dependency installation, auto-fixing lint, schema relocation or commit was performed. Stop after Events; other modules require a new request.

## OrderService aligned with existing services — 2026-10-10

Reviewed ProductService, MemberService, BoardArticleService, CommentService and LikeService. Refactored all four existing OrderService methods to use their formatting, input destructuring, search/match objects, targetOrder/result naming, explicit model result types and fluent Mongoose queries ending in exec(). Expanded the aggregation lookups and item data for readability; named the product-only sum subtotal. Kept existing exception classes/messages, query filters, write ordering, shipping, ownership, status/stock/points behavior and separate writes. No helpers, methods, transactions, validations, dependencies or GraphQL changes were added. Existing tests required no changes.

Recorded the user's ongoing refactoring style preference in DECISIONS.md. Only OrderService and these two handoff docs changed in this increment; pre-existing changes were preserved. Validation: all 33 tests across 2 suites PASS (including offline GraphQL checks); API/batch TypeScript checks with --noEmit PASS; npm run build PASS (API); git diff --check PASS. No live MongoDB or HTTP/e2e tests were run.

## Clearer updateOrder flow — 2026-10-10

Simplified updateOrder only: replaced canProcess/canFinish flags with an explicit next-status mapping, returned immediately after FINISHED and flattened the PROCESS stock/points steps. Added short comments explaining the flow. Existing checks cover business rules rather than duplicated DTO input validation, so ownership, active member/shop, allowed transitions, conditional status claiming, nonempty items and conditional stock deductions remain. No sessions, helpers, GraphQL changes or new behavior were introduced. Separate-write failure limitations documented below still apply.

Expanded transition tests to cover skipped and backward changes without status, stock or point writes. Validation: all 33 tests across 2 suites PASS (including offline GraphQL checks); API and batch TypeScript checks with --noEmit PASS; npm run build PASS (API); git diff --check PASS. No live database or HTTP/e2e tests were run. Only OrderService, its existing order-delivery test file and this ledger were edited in this increment; pre-existing changes were preserved.

## Simplified Express-style OrderService — 2026-10-10

COMPLETED after the user explicitly approved removal of transactions as well as unnecessary service validation. Existing uncommitted migration changes were preserved.

Changes:

- components/order/order.service.ts: only four original methods remain. Removed sessions, withTransaction, assertActiveMember, service-level enum/address/cart checks duplicated by DTOs/schemas, safe-integer/finite-number checks and duplicate-product Set rejection. Creation follows find → map → reduce → create → recordOrderItem; item persistence follows map/Promise.all/create. Current member/shop checks are inline; database prices, ownership, stock checks, status transitions and shipping rules remain.
- components/member/member.service.ts: reverted only the earlier session-support hunks in memberStatsEditor. It again takes the original StatisticModifier argument and performs its existing $inc. No other member logic changed.
- components/order/order-delivery.spec.ts: mocks now reflect separate writes; input validation is tested at its DTO/schema boundary. Added duplicate-line totals and six status/stock/points cases, including repeated/competing requests and the explicit partial-write consequence.
- Updated this file, BACKEND_MIGRATION, DECISIONS and NEXT_STEPS. Schemas, DTOs, enums, GraphQL operations, auth/guards, modules and product services were not changed in this increment.

Without transactions, updateOrder first claims the old status using a conditional update, then deducts stock and grants one point using MemberService. This prevents competing requests from applying the same transition twice. A failed later write does not roll back the status or earlier writes. Creation may leave incomplete items; retrying the same PROCESS status does not repair failures. These limits are intentional under the user's latest decision, not guarantees of atomicity.

Validation: npx tsc for apps/gamenix-api/tsconfig.app.json and apps/gamenix-batch/tsconfig.app.json with --noEmit PASS; npm run build PASS (API); ./node_modules/.bin/jest --runInBand --silent PASS, 2 suites / 30 tests (25 order tests and 5 existing guard tests); git diff --check PASS. Offline GraphQL schema checks are included. No auto-fixing lint, live MongoDB tests or HTTP/e2e tests were run. Competing-update tests use an atomic mock and do not replace database concurrency verification.

## Delivery pricing, order address and pickup — 2026-10-10

COMPLETED under the user's clarified delivery/address request and confirmed fee rules. Added orderAddress, restored orderDelivery as a numeric price and introduced PICKUP / DELIVERY fulfillment choices. DELIVERY is the default and requires an address; PICKUP has free shipping and may omit it.

Pricing in USD, once per order: any delivered CHAIR or DESK costs 15, including mixed same-shop orders; other delivery costs 5 below subtotal 100 and 0 at/above 100; pickup costs 0 for every category. Totals use database product prices times quantities plus the delivery fee, rounded to two decimals. No discount is applied.

Files changed for this increment (source paths relative to apps/gamenix-api/src):

- schemas/Order.model.ts: numeric nonnegative fee, separate conditionally required address and fulfillment enum/default.
- libs/enums/order.enum.ts: registered OrderDeliveryType PICKUP / DELIVERY; OrderStatus unchanged.
- libs/dto/order/order.ts: fee/address/fulfillment output fields; address nullable for pickup.
- libs/dto/order/order.input.ts: fulfillment choice and conditionally required address; fee/total remain server-controlled.
- components/order/order.service.ts: address/fulfillment checks and simple shipping calculation in createOrder. Method names are unchanged; item persistence, history, stock/status/points and authorization method bodies remain unchanged.
- components/order/order-delivery.spec.ts: 19 focused schema, validation, GraphQL and service fee tests.
- This file plus BACKEND_MIGRATION, DECISIONS and NEXT_STEPS: current semantics, rules, validation and compatibility notes. No guard, authentication, product service, MemberService, resolver, OrderUpdate or module wiring changes were made in this increment. Pre-existing working-tree changes were preserved.

Example delivery creation input: {orderDeliveryType: DELIVERY, orderAddress: "Seoul address", orderItems: [{productId: "<product-id>", itemQuantity: 1}]}. For pickup use PICKUP and omit orderAddress. The server returns orderDelivery and orderTotal.

Validation:

- npx tsc -p apps/gamenix-api/tsconfig.app.json --noEmit: PASS.
- npx tsc -p apps/gamenix-batch/tsconfig.app.json --noEmit: PASS.
- npm run build: PASS (API).
- ./node_modules/.bin/nest build gamenix-batch: PASS.
- ./node_modules/.bin/jest --runInBand --silent: PASS, 2 suites / 24 tests (19 new order tests and the existing 5 guard tests).
- Offline GraphQL schema generation, field types, default choice and server-controlled input contract: PASS within the tests.
- Method/body comparison: item persistence, order history, status/stock/points and authorization logic preserved.
- git diff --check: PASS. No auto-fixing lint was run.

Tests cover numeric/negative/free shipping, required delivery address, pickup without address, default fulfillment, quantity-based threshold, 99.99/100 boundary, chair/desk fees, mixed orders, total calculation, stored item prices and supplied-fee spoofing. Service database calls are mocked. Live MongoDB transactions/rollback/concurrency and HTTP/e2e behavior were not tested. Existing order documents and frontend requests using the old string orderDelivery contract require a reviewed migration; none was executed.

## Perfumia-style order implementation — 2026-10-09

COMPLETED under the new order implementation request. The working tree was clean before this task. Read Perfumia's order service/controller/types/enums/schemas/router as a reference; no Perfumia files were modified. Preserved Gamenix ER schemas, string delivery address and product-only totals as explicitly selected by the user.

Files changed (all source paths relative to `apps/gamenix-api/src`):

- `components/order/order.module.ts`: register existing OrderItem, Product and Member models alongside Order; import AuthModule.
- `components/order/order.resolver.ts`: authenticated createOrder, getMyOrders and updateOrder following existing decorators and DI patterns.
- `components/order/order.service.ts`: server-side price snapshots/totals, active member/shop checks, one-shop validation, paginated buyer order joins, owned forward-only status changes, transactional stock decrement and one-point reward on PROCESS, same-state retry handling and session cleanup.
- `libs/dto/order/order.input.ts`: creation address/items and OrdersInquiry pagination/status filter.
- `libs/dto/order/order.update.ts`: only order ID and required status; remove client-controlled total/address from status commands.
- `libs/dto/order/order.ts`: optional aggregation fields orderItems/productData.
- `libs/dto/order-item/order-item.input.ts`: only quantity/product ID; prices and parent order IDs are assigned server-side.
- Added `components/order/order.service.spec.ts` and `components/order/order.resolver.spec.ts`.
- Updated this file, BACKEND_MIGRATION, DECISIONS and NEXT_STEPS. No schemas, guards, auth implementation, product services, event components, dependencies or database configuration changed.

New GraphQL input examples:

```graphql
# createOrder(input: OrderInput!): Order!
# input: {orderDelivery: "Seoul address", orderItems: [{productId: "<product-id>", itemQuantity: 2}]}
# getMyOrders(input: OrdersInquiry!): [Order!]!
# input: {page: 1, limit: 10, orderStatus: PROCESS} # status is optional
# updateOrder(input: OrderUpdate!): Order!
# input: {_id: "<order-id>", orderStatus: PROCESS} # then FINISHED
```

Validation:

- `npx tsc -p apps/gamenix-api/tsconfig.app.json --noEmit`: PASS. Subsequent API and batch checks using the installed `./node_modules/.bin/tsc` also PASS.
- `npx tsc -p apps/gamenix-batch/tsconfig.app.json --noEmit`: PASS.
- `npm run build`: PASS (API).
- `./node_modules/.bin/nest build gamenix-batch`: PASS.
- `./node_modules/.bin/jest --runInBand`: PASS, 3 suites / 32 tests (27 order tests plus the existing 5 guard tests).
- GraphQL schema generation and actual OrderModule dependency resolution: PASS offline within those tests.
- `git diff --check`: PASS. No auto-fixing lint was run.

Coverage includes database-derived prices/ownership, mixed shops, invalid/duplicate items, stock and approval checks, buyer-only listing/update filters, transitions, repeat PROCESS, same-session writes, failed item writes and later-item stock failure, nested DTO validation and GraphQL input exposure. Database operations are mocked: no live MongoDB rollback/concurrency, deployment topology, payment or HTTP/e2e verification occurred.

Operational limits: MongoDB transactions require a replica set or sharded cluster. PAUSE does not reserve stock; availability is rechecked on PROCESS. PROCESS is not payment verification. Create retries can create separate orders. No cancellation/restock, shop/admin order management or event business logic was added. The separate catalog approval gap remains unchanged.

## Event and order component scaffolds — 2026-10-09

COMPLETED: created six files under `apps/gamenix-api/src/components`:

- `event/event.module.ts`, `event/event.resolver.ts`, `event/event.service.ts`
- `order/order.module.ts`, `order/order.resolver.ts`, `order/order.service.ts`

Modified `components/components.module.ts` to import/register both modules. Kept existing singular domain naming, @Module/@Resolver/@Injectable decorators, constructor injection, Mongoose model registration and service-export conventions. Event and Order reuse existing schemas and DTO types in place. Related OrderItem/EventParticipant models are not registered here.

No application operations or business logic were introduced. Authentication, guards, uploads, product/member logic, schemas and DTOs remain unchanged. Existing event/order data definitions now have modules/services/resolvers, but CRUD, checkout and registration operations remain unimplemented. Updated BACKEND_MIGRATION, COMPLETED_TASKS and NEXT_STEPS to distinguish scaffolding from feature completion.

Validation: both app `npx tsc -p .../tsconfig.app.json --noEmit` checks PASS; `npm run build` PASS (API); `npm test -- --runInBand --watch=false --silent` PASS (1 suite / 5 tests currently present). An offline Nest TestingModule with mocked model providers resolved EventResolver/EventService and OrderResolver/OrderService successfully. No live database connection, deployed index or runtime feature behavior was tested.

## Guard preservation correction — 2026-10-09

At the user's request, reverted only the agent's RolesGuard changes and the dependent AuthModule Member-model registration/export. No user changes existed in those diffs. Production `roles.guard.ts`, `auth.guard.ts`, `without.guard.ts` and `auth.module.ts` now match HEAD exactly (verified with git diff --exit-code).

Retained service changes: SHOP/PENDING signup, public ADMIN signup rejection and prevention of self-service role/status writes. The user's PENDING enum addition is preserved. Existing ADMIN operations and all other architecture remain unchanged.

Updated the newly created `components/auth/guards/shop-approval.spec.ts` to test unchanged role-based behavior instead of the removed current-member checks. The test explicitly records that PENDING SHOP tokens are still allowed by the original guard. No production guard modifications or replacement authorization feature remains. Updated these four handoff docs to distinguish the remaining approval-enforcement gap from the historical completed implementation below.

Current validation:

- API TypeScript check: PASS.
- Batch TypeScript check: PASS.
- npm run build: PASS (API).
- nest build gamenix-batch: PASS.
- npm test -- --runInBand --watch=false --silent: PASS, 3 suites / 38 tests.
- Production guards/AuthModule compared with HEAD: identical.

SHOP operational status restrictions and current-database authorization freshness are NOT implemented after this reversal. Existing admin status updates still work, but PENDING accounts are not prevented from SHOP role-protected operations. No alternative solution was introduced automatically. Earlier 44-test and enforcement claims below describe the superseded state.

## Earlier records — latest correction takes precedence

## Minimal Phase 2 SHOP approval — 2026-10-09

COMPLETED after the user approved the revised minimal file list. Only the user's existing MemberStatus.PENDING addition was uncommitted at the start; it was preserved without edits. The broader earlier auth/upload changes were not present and were not restored.

Source files modified:

- `apps/gamenix-api/src/components/member/member.service.ts` — reject public ADMIN signup; set SHOP signup to PENDING before the unchanged hash/create/token sequence; reject self-updates of role/status to prevent approval bypass. Existing login and admin update implementation are unchanged.
- `apps/gamenix-api/src/components/auth/guards/roles.guard.ts` — after unchanged JWT verification, load current Member and require the current role; require ACTIVE for SHOP/ADMIN. Missing current members are denied. Existing JWTs reflect approval/blocking/demotion at the next role-protected request. Ordinary USER status rules were not expanded.
- `apps/gamenix-api/src/components/auth/auth.module.ts` — register/export the existing Member model so consumer-module RolesGuards can query it; AuthService remains unchanged.

Test files created:

- `apps/gamenix-api/src/components/member/shop-approval.spec.ts`
- `apps/gamenix-api/src/components/auth/guards/shop-approval.spec.ts`

Documentation modified:

- `docs/ai/BACKEND_MIGRATION.md`
- `docs/ai/DECISIONS.md`
- `docs/ai/COMPLETED_TASKS.md`
- `docs/ai/NEXT_STEPS.md`

Existing operations used, without new mutations/DTOs:

- signup(input: MemberInput) and login(input: LoginInput).
- getAllMembersByAdmin(input: MembersInquiry), with SHOP/PENDING search filters, lists pending shops.
- updateMemberByAdmin(input: MemberUpdate) with {_id: shopId, memberStatus: ACTIVE} approves the account under existing ADMIN/RolesGuard authorization.

USER remains ACTIVE by the existing schema default. SHOP begins PENDING and may log in under the existing login rules, but cannot perform SHOP role-protected operations. Admin approval sets ACTIVE through existing trusted status management; no separate rejection workflow was implemented. Self role/status writes are rejected even though MemberUpdate retains these fields for the existing admin operation.

| Validation command | Result |
|---|---|
| `npx tsc -p apps/gamenix-api/tsconfig.app.json --noEmit` | PASS — no compilation errors |
| `npx tsc -p apps/gamenix-batch/tsconfig.app.json --noEmit` | PASS — no compilation errors |
| `npm run build` | PASS — API webpack |
| `./node_modules/.bin/nest build gamenix-batch` | PASS — batch webpack |
| `npm test -- --runInBand --watch=false --silent` | PASS — 3 suites, 44 tests |
| `git diff --check` | PASS |

The existing 20 ER tests were preserved. New tests cover unchanged USER signup/defaults, real bcrypt/JWT helpers, SHOP/PENDING signup/login, active login, existing credential/block rejection, public ADMIN rejection, self-approval/promotion denial, unchanged ordinary profile/image-path updates, existing admin filters/status updates, pending/active/blocked SHOP authorization, non-admin approval denial, stale-token approval/demotion behavior and cross-module Member-model injection.

Limitations: no live MongoDB or HTTP/e2e tests ran. Existing GraphQL upload mutations/static /uploads serving remain untouched; no HTTP upload endpoint was found in this checkout, so Axios upload compatibility is NOT VERIFIED. Existing ACTIVE-only profile-update behavior means a pending shop cannot save memberImage through updateMember before approval; the external/missing HTTP endpoint's persistence behavior is unknown. No new upload or signup-image requirement was added. No new admin bootstrap or existing-account reclassification was performed.

AuthService, AuthGuard/WithoutGuard, password hashing, JWT payload/signing, member resolvers/DTOs, schemas, product/order/event/community/socket source, app paths, dependency/config files and other handoff files were not changed. No lint auto-fix, commits or further phase work was performed. npm log-directory sandbox warnings did not affect successful checks.

Earlier phase records below retain historical decisions and validation; this revised minimal implementation is the current source of truth for shop approval.

## Earlier phase records

## EventParticipant completion — 2026-10-09

COMPLETED: the user confirmed ParticipantStatus REGISTERED / CANCELLED and authorized the remaining Phase 1 data definitions. Phase 1 ER schemas/DTOs/enums are now complete. Earlier partial-status records below describe the state before this follow-up.

Created (paths relative to `apps/gamenix-api/src`):

- `schemas/EventParticipant.model.ts`: exactly the ER fields plus standard Mongoose metadata, timestamps, collection `eventParticipants`, required Event/Member ObjectId refs, default REGISTERED, enum validation and unique compound `(eventId, memberId)` index.
- `libs/enums/participant.enum.ts`: ParticipantStatus REGISTERED / CANCELLED and GraphQL enum registration.
- `libs/dto/event-participant/event-participant.ts`: GraphQL output with IDs, status and timestamps.
- `libs/dto/event-participant/event-participant.input.ts`: required eventId, optional status, internal memberId for future authenticated assignment, matching existing ownership DTO conventions.
- `libs/dto/event-participant/event-participant.update.ts`: required `_id` and optional validated status; Event/Member references stay fixed in this DTO.

Modified: `apps/gamenix-api/src/libs/dto/er-model.spec.ts` with participant enum/GraphQL/ref/index/default/invalid-state/invalid-ID coverage, plus the six `docs/ai/*.md` handoff files to close the participant dependency and retain migration history. All other pre-existing working-tree changes were preserved. No schemas were relocated; no auth, guards, product services, orders, community or batch source was changed in this follow-up.

Validation after implementation:

| Command | Result |
|---|---|
| `npx tsc -p apps/gamenix-api/tsconfig.app.json --noEmit` | PASS — no compilation errors |
| `npx tsc -p apps/gamenix-batch/tsconfig.app.json --noEmit` | PASS — no compilation errors |
| `npm run build` | PASS — API webpack |
| `./node_modules/.bin/nest build gamenix-batch` | PASS — batch webpack |
| `npm test -- --runInBand --watch=false` | PASS — 1 suite, 20 tests |

The unique index covers CANCELLED records too; future registration code must decide how to reuse an existing pair. Only offline schema/index definitions and DTO validation were tested; no live database/index deployment or duplicate-write integration test was run. npm log-directory sandbox warnings did not affect successful results.

No registration services, GraphQL registration operations or application model providers were added. Future authentication assignment, authorization, reference existence checks, capacity/deadlines, re-registration and duplicate-key handling remain business work requiring Phase 2 approval. Phase 2 has not started.

## Earlier ER Phase 1 increment — before participant completion, 2026-10-09

The working tree was clean before this increment. Completed: MemberType AGENT → SHOP, memberProducts schema/output/counters; Product schema, enum, DTOs, module/resolver/service rename and required lifecycle adaptations; Order, OrderItem and Event schemas/object/input/update DTOs/enums; directly dependent comment/like/view/notification/config/batch references. Product fields/categories match the ER; housing fields/filters and the old unique index are removed. Auth/JWT/guards/password behavior, community operations and sockets were preserved.

ProductStatus mapping was explicitly approved by the user: active PROCESS, sold FINISHED, deletion through deletedAt. PAUSE remains editable without a counter decrement. Sale and deletion paths now persist Date values; the focused tests exposed the old Moment default-import incompatibility, so these directly affected timestamp paths use native `new Date()`.

PARTIAL: EventParticipant requires confirmation of participantStatus values. No participant enum/schema/DTO files have been invented. Phase 1 is not declared fully complete. No order/event services, checkout, payment, inventory deduction, event registration, new WebSocket or frontend behavior has been implemented. New Order/OrderItem/Event schemas/DTOs are definitions, not runtime endpoints/providers.

### Validation for this increment

- Both API and batch TypeScript checks: PASS (no compilation errors).
- `npm run build`: PASS (API webpack).
- `./node_modules/.bin/nest build gamenix-batch`: PASS.
- `npm test -- --runInBand --watch=false`: PASS, 1 suite / 16 tests in the final working tree. Covers offline GraphQL DTO generation and Mongoose shape/reference/default/validation checks. Earlier, an additional lifecycle suite passed (23 total tests) after three timestamp tests exposed Moment default-import interop; the directly affected code was corrected. That lifecycle spec disappeared from the working tree during final review, so its removal was preserved and the remaining suite rerun. The file is not part of the final inventory.
- No lint auto-fix, live database migration, database integration, full-app HTTP/GraphQL authorization/e2e, frontend or socket testing was performed. Model refs/index definitions are not proof of deployed indexes or authorization. npm log-directory sandbox warnings did not prevent successful commands.

### Remaining compatibility and business work

Stored AGENT/PROPERTY data, old collection/field names, client documents and JWTs are not migrated automatically. Existing member-counter writes are nontransactional. No new SHOP enforcement services or one-shop order validation exist for the new definitions. EventParticipant remains the Phase 1 dependency; new operations and all Phase 2 work require separate approval.

### File inventory for this increment

The removed Property paths below are superseded by their corresponding Product files; no unrelated functionality/files were removed. No app directories were renamed. All paths are relative to the repository root.

#### Created

- `apps/gamenix-api/src/components/product/product.module.ts`
- `apps/gamenix-api/src/components/product/product.resolver.ts`
- `apps/gamenix-api/src/components/product/product.service.ts`
- `apps/gamenix-api/src/libs/dto/er-model.spec.ts`
- `apps/gamenix-api/src/libs/dto/event/event.input.ts`
- `apps/gamenix-api/src/libs/dto/event/event.ts`
- `apps/gamenix-api/src/libs/dto/event/event.update.ts`
- `apps/gamenix-api/src/libs/dto/order-item/order-item.input.ts`
- `apps/gamenix-api/src/libs/dto/order-item/order-item.ts`
- `apps/gamenix-api/src/libs/dto/order-item/order-item.update.ts`
- `apps/gamenix-api/src/libs/dto/order/order.input.ts`
- `apps/gamenix-api/src/libs/dto/order/order.ts`
- `apps/gamenix-api/src/libs/dto/order/order.update.ts`
- `apps/gamenix-api/src/libs/dto/product/product.input.ts`
- `apps/gamenix-api/src/libs/dto/product/product.ts`
- `apps/gamenix-api/src/libs/dto/product/product.update.ts`
- `apps/gamenix-api/src/libs/enums/event.enum.ts`
- `apps/gamenix-api/src/libs/enums/order.enum.ts`
- `apps/gamenix-api/src/libs/enums/product.enum.ts`
- `apps/gamenix-api/src/schemas/Event.model.ts`
- `apps/gamenix-api/src/schemas/Order.model.ts`
- `apps/gamenix-api/src/schemas/OrderItem.model.ts`
- `apps/gamenix-api/src/schemas/Product.model.ts`

#### Modified

- `apps/gamenix-api/src/components/comment/comment.module.ts`
- `apps/gamenix-api/src/components/comment/comment.service.ts`
- `apps/gamenix-api/src/components/components.module.ts`
- `apps/gamenix-api/src/components/like/like.service.ts`
- `apps/gamenix-api/src/components/member/member.resolver.ts`
- `apps/gamenix-api/src/components/member/member.service.ts`
- `apps/gamenix-api/src/components/view/view.service.ts`
- `apps/gamenix-api/src/libs/config.ts`
- `apps/gamenix-api/src/libs/dto/member/member.ts`
- `apps/gamenix-api/src/libs/enums/comment.enum.ts`
- `apps/gamenix-api/src/libs/enums/like.enum.ts`
- `apps/gamenix-api/src/libs/enums/member.enum.ts`
- `apps/gamenix-api/src/libs/enums/notification.enum.ts`
- `apps/gamenix-api/src/libs/enums/view.enum.ts`
- `apps/gamenix-api/src/schemas/Member.model.ts`
- `apps/gamenix-api/src/schemas/Notification.model.ts`
- `apps/gamenix-batch/src/batch.controller.ts`
- `apps/gamenix-batch/src/batch.module.ts`
- `apps/gamenix-batch/src/batch.service.ts`
- `apps/gamenix-batch/src/lib/config.ts`
- `docs/ai/BACKEND_MIGRATION.md`
- `docs/ai/COMPLETED_TASKS.md`
- `docs/ai/DECISIONS.md`
- `docs/ai/FRONTEND_MIGRATION.md`
- `docs/ai/NEXT_STEPS.md`
- `docs/ai/PROMPTS.md`

#### Superseded Property paths

- `apps/gamenix-api/src/components/property/property.module.ts`
- `apps/gamenix-api/src/components/property/property.resolver.ts`
- `apps/gamenix-api/src/components/property/property.service.ts`
- `apps/gamenix-api/src/libs/dto/property/property.input.ts`
- `apps/gamenix-api/src/libs/dto/property/property.ts`
- `apps/gamenix-api/src/libs/dto/property/property.update.ts`
- `apps/gamenix-api/src/libs/enums/property.enum.ts`
- `apps/gamenix-api/src/schemas/Property.model.ts`

## Historical snapshot — retained for migration history

The following records describe earlier repository states and proposals. Current status and accepted decisions above take precedence. Earlier validation records remain historical.

Snapshot: 2026-10-09 (Asia/Seoul).

## Status definitions and provenance

- **COMPLETED**: confirmed source/documentation exists or a recorded action finished; runtime success requires its own evidence.
- **IN PROGRESS**: work actually started and unfinished.
- **PLANNED / NOT STARTED**: requested target without implementation evidence.
- **NOT VERIFIED**: no executed validation result or insufficient runtime evidence.

This session contains the user instructions, attached documentation request, repository inspection, and creation of these six handoff files. It contains no prior backend implementation work. Pre-existing code below is not attributed to this session. Initial `git status --short` was clean; latest inspected commit was `1420cfd` (`feat: create Agents and Skills for AI agents`). The referenced handoff folder did not exist before this task.

## COMPLETED in this session

| Work | Evidence |
|---|---|
| Read attached request and repository instructions | `AGENTS.md`; user attachment |
| Inspect actual application/configuration/domain/test sources | `package.json`, `nest-cli.json`, `tsconfig.json`, both apps and sources listed below |
| Identify target/current discrepancies and validation boundaries | App names, AGENT role, property catalog, absent product/order/event/frontend sources |
| Create backend migration snapshot | `docs/ai/BACKEND_MIGRATION.md` |
| Record confirmed requirements versus pending mechanisms | `docs/ai/DECISIONS.md` |
| Create phased frontend plan without invented paths | `docs/ai/FRONTEND_MIGRATION.md` |
| Record evidence and validation status | `docs/ai/COMPLETED_TASKS.md` |
| Prioritize remaining work | `docs/ai/NEXT_STEPS.md` |
| Save reusable next-session prompts | `docs/ai/PROMPTS.md` |

The initial documentation task changed only the six handoff files. The subsequent authorized project rename is recorded below. No dependency was installed and no database migration was executed.

## Existing functionality confirmed in source, runtime NOT VERIFIED

| Area | Exact source evidence | Scope |
|---|---|---|
| API/batch monorepo | `nest-cli.json`, `apps/gamenix-api/src/app.module.ts`, `apps/gamenix-batch/src/batch.module.ts` | Gamenix app names/configuration now applied; original domain logic preserved |
| Authentication | `apps/gamenix-api/src/components/auth/auth.service.ts`; `components/member/member.service.ts` under the same `src` | bcrypt signup/login, JWT creation/verification; not a role migration |
| Member roles | `apps/gamenix-api/src/libs/enums/member.enum.ts` | USER / AGENT / ADMIN, no SHOP |
| Catalog module/resolver/service | `apps/gamenix-api/src/components/property/property.module.ts`, `property.resolver.ts`, `property.service.ts` | Property creation/read/update, agent/admin listing/actions, favorites/visited/likes |
| Catalog DTOs/enums/schema | `apps/gamenix-api/src/libs/dto/property/property.ts`, `property.input.ts`, `property.update.ts`; `libs/enums/property.enum.ts`; `schemas/Property.model.ts` under the same `src` | Real-estate fields and categories; no product stock |
| Member inquiries/updates/schema | `apps/gamenix-api/src/libs/dto/member/member.input.ts`, `member.update.ts`; `apps/gamenix-api/src/schemas/Member.model.ts` | AgentsInquiry, member counters and role/status inputs remain |
| Community | `apps/gamenix-api/src/components/board-article/board-article.resolver.ts`, `comment/comment.resolver.ts`, `follow/follow.resolver.ts`, `like/like.service.ts`, `view/view.service.ts` | Existing article/comment/follow operations, generic interactions and property-specific dependencies |
| Socket | `apps/gamenix-api/src/socket/socket.gateway.ts`, `apps/gamenix-api/src/main.ts` | Optional URL-token auth, client Map, global broadcast, five in-memory messages |
| Batch | `apps/gamenix-batch/src/batch.service.ts` | Property/agent rank reset and calculation; shared API model imports |
| Notifications/notices | `apps/gamenix-api/src/schemas/Notification.model.ts`, `Notice.model.ts` | Schema presence only; dedicated feature implementation not established |

## Migration completion ledger

| Target | Status | Evidence / missing work |
|---|---|---|
| Backend app naming/configuration rename | COMPLETED | Gamenix app folders, config/scripts/package metadata/imports and name labels |
| Property module/file/class/interface migration | PLANNED / NOT STARTED | Property domain names remain |
| Product GraphQL operation/input/output migration | PLANNED / NOT STARTED | Current operations are property-based |
| Gaming category DTO/enum/schema/filter migration | PLANNED / NOT STARTED | APARTMENT / VILLA / HOUSE and housing filters remain |
| AGENT → SHOP auth/member/permission migration | PLANNED / NOT STARTED | No SHOP enum; privileged-field policy needs review |
| Product ownership and inventory | PLANNED / NOT STARTED | Property owner predicate exists; no productLeftCount/product model |
| Order/order-item and single-shop validation | PLANNED / NOT STARTED | No implementation found |
| Event/participant and duplicate prevention | PLANNED / NOT STARTED | No implementation found |
| Community reuse for products | PLANNED | Existing community code needs PROPERTY references updated |
| Private customer/shop chat | PLANNED / NOT STARTED | Global chat exists; conversation routing/persistence absent |
| Next.js frontend migration | PLANNED / NOT STARTED here | Frontend checkout not found |

No application migration task is recorded as IN PROGRESS; this session completed documentation only.

## Initial documentation-task validation record

Read-only checks executed: `git status --short`, `git log -5 --oneline`, `rg --files`, targeted `rg -n`, directory listing, and source/config/test reads. These support implementation inventory, not compilation/runtime correctness. Documentation was checked for the six expected files, valid relative documentation links, and absence of tracked application changes.

| Command / check | Result this session |
|---|---|
| `npx tsc -p apps/gamenix-api/tsconfig.app.json --noEmit` | NOT VERIFIED during the initial documentation task — not run; paths were absent then |
| `npx tsc -p apps/gamenix-batch/tsconfig.app.json --noEmit` | NOT VERIFIED during the initial documentation task — not run; paths were absent then |
| Current-path API/batch TypeScript checks | NOT VERIFIED — not run |
| `npm run build` | NOT VERIFIED — not run; targeted Nestar API by default at that time |
| Unit/e2e, GraphQL, authorization, inventory/order, event, socket tests | NOT VERIFIED — not run |
| `npm run lint` | Not run; script uses `--fix` |

To preserve the six-file-only scope, builds and compiler checks that may emit build metadata/output were not run. Existing e2e files are `apps/gamenix-api/test/app.e2e-spec.ts` and `apps/gamenix-batch/test/app.e2e-spec.ts`; each checks a root greeting against `Hello World!`. No focused product/order/event/socket tests were found in the inspected source inventory. Test files do not establish passing tests.

## Known gaps and source findings

- App naming now matches `AGENTS.md`; target schema placement still differs from current `src/schemas`.
- Signup and ordinary member update expose `memberType`; member update also exposes `memberStatus`. Services pass these through, creating a privileged-field risk requiring tests and a focused fix.
- `RolesGuard` dereferences `authMember.memberType` before checking `authMember` for absence.
- Property update/admin update compute local `soldAt` / `deletedAt` values without copying them into the persisted input; timestamp behavior needs correction/verification.
- Socket gateway logs connection tokens, permits guests to send global messages, and has no private conversation authorization or durable history.
- Product stock, checkout, orders, tournaments/giveaways and registrations are absent from the inspected implementation.
- Deployed database contents, deployed API schema, frontend code, payment/shipping policy and historical validation outcomes are unknown.

These findings are from static inspection; runtime reproduction is NOT VERIFIED.

## Subsequent session work: project rename to Gamenix (2026-10-09)

COMPLETED: user requested `gamenix` naming, preserving existing structure and application logic. Renamed `apps/nestar-api` → `apps/gamenix-api` and `apps/nestar-batch` → `apps/gamenix-batch`. Updated `package.json`, root package names in `package-lock.json`, `nest-cli.json`, both `tsconfig.app.json` output paths, API/batch absolute imports, API/batch greeting labels and batch e2e describe label. Updated `AGENTS.md`, `SKILLS.md` and the handoff documentation to use Gamenix and current paths. Historical Nestar mentions remain only in documentation.

No domain refactor, schema relocation, dependency installation or database change was included. Validation executed successfully after the rename:

| Command / check | Result |
|---|---|
| `npx tsc -p apps/gamenix-api/tsconfig.app.json --noEmit` | PASS |
| `npx tsc -p apps/gamenix-batch/tsconfig.app.json --noEmit` | PASS |
| `npm run build` | PASS — default Gamenix API webpack compilation |
| `./node_modules/.bin/nest build gamenix-batch` | PASS — batch webpack compilation |
| Compare all moved application files to HEAD with only name/path substitutions | PASS |
| Package/lockfile root names and Nest project path consistency | PASS |

npm emitted a sandbox warning about writing its log directory; compilation/builds still exited successfully. No runtime/GraphQL/e2e tests were executed for this naming-only change.
