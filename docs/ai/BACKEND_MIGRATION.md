# Backend migration: Nestar → Gamenix

## Event and order scaffolding — 2026-10-09

The user requested component modules with resolvers/services matching existing style. Added `components/event/event.{module,resolver,service}.ts` and `components/order/order.{module,resolver,service}.ts` under the existing API src directory. ComponentsModule imports EventModule and OrderModule. Each registers its existing primary Mongoose schema, provides its resolver/service and exports its service; services inject Model<Event>/Model<Order>, and resolvers inject the corresponding service.

This is scaffolding only: no GraphQL queries/mutations, checkout, inventory, order calculations or event registration behavior was added. OrderItem and EventParticipant model providers are not registered by these scaffolds. Existing schemas/DTOs, authentication and guards remain unchanged. Earlier statements that Event/Order have no application modules are superseded by this section; their business operations still do not exist.

Both app TypeScript checks and the API build pass. All 5 tests currently present pass; an offline Nest testing-module check resolved both services, resolvers and their model dependencies. No live database/startup test was run. Registering these modules makes Event and Order models available at runtime using their existing collection configuration.

## Current correction — guards preserved, 2026-10-09

The user subsequently instructed: do not change guard files. The agent's RolesGuard changes were reverted, along with the AuthModule Member-model registration/export that existed only to support that guard change. All production guards and AuthModule now match HEAD exactly.

Retained: SHOP signup sets PENDING, public ADMIN signup is rejected, and self-update cannot change role/status. Existing ADMIN listing and status-update operations remain available. No alternative authorization implementation was added.

IMPORTANT remaining gap: original RolesGuard checks the JWT role only. A PENDING SHOP token can therefore pass SHOP role checks; current-database status restrictions and immediate approval/blocking effects are NOT implemented. Minimal shop approval enforcement is incomplete under the new guard constraint. Earlier statements below claiming enforced restrictions or 44 passing tests are historical and superseded by this correction.

Validation after reversal: both app TypeScript checks and both builds pass; all 38 tests pass (3 suites). Guard tests now document the actual unchanged role-only behavior, including the pending-status limitation. No HTTP upload endpoint was found; upload code remains unchanged.

## Earlier records — latest correction takes precedence

## Current Phase 2 state — minimal SHOP approval, 2026-10-09

The revised minimal request supersedes the earlier broader authentication/upload proposal. The user approved exactly three source files, two focused test files and four handoff docs. Before this increment, the working tree contained only the user's MemberStatus.PENDING enum addition; it was preserved unchanged.

SHOP signup now sets memberStatus=PENDING in the existing MemberService.signup before the existing hash/create/token sequence. Public signup accepts USER or SHOP and rejects ADMIN. USER signup retains schema defaults and existing credentials. Login, password hashing, JWT creation/verification, AuthService, AuthGuard, WithoutGuard, decorators, DTOs and resolvers are unchanged.

Existing admin operations provide the whole workflow:

- Pending list: getAllMembersByAdmin with search {memberType: SHOP, memberStatus: PENDING}.
- Approval: updateMemberByAdmin with input {_id: shopId, memberStatus: ACTIVE} using the existing MemberUpdate type and ADMIN RolesGuard metadata.
- No dedicated approval/rejection mutations, new DTOs, shop modules or application collections were added. Existing trusted admin member management remains as before.

RolesGuard still verifies the same JWT, then loads the current Member by its signed ID. It checks the current role; SHOP and ADMIN must be ACTIVE. PENDING/BLOCK/DELETE shops cannot use protected SHOP operations, and non-admin members cannot use admin approval. Approval/demotion/blocking affects existing JWTs at the next RolesGuard-protected request. No new status restriction was added for ordinary USER roles. AuthModule registers/exports the existing Member model for this lookup; AuthService is unchanged.

Self-update rejects memberType/memberStatus writes at the service boundary, because otherwise an ordinary account could promote itself to ADMIN and bypass approval. MemberInput and MemberUpdate GraphQL shapes are unchanged; trusted ADMIN updates retain privileged fields. Other profile updates, including memberImage paths, retain their existing behavior.

Validation: API/batch TypeScript checks and builds pass; all 44 tests pass (3 suites, including the existing 20 ER tests). See COMPLETED_TASKS for exact commands/files. No production MongoDB or HTTP/e2e test was run.

Upload limitation: repository inspection found existing GraphQL imageUploader/imagesUploader and static GET /uploads serving, but no HTTP POST upload endpoint. No upload code, scalars, dependencies or frontend code were added or modified. The stated Axios HTTP upload flow remains unverified until its actual endpoint is located. Existing member profile updates require ACTIVE status, so a PENDING shop cannot save a picture via updateMember before approval; an external HTTP endpoint's behavior is unknown. No image requirement was added to signup.

This increment completes only minimal pending-shop approval. No broader auth redesign, product/order/event/community/socket changes or further phase work was performed. Earlier phase records below are retained as history; this current section takes precedence.

## Earlier phase records

## Current Phase 1 state — 2026-10-09

This section supersedes the historical snapshot below. The latest attached Phase 1 request authorizes ER schemas, GraphQL data definitions, enums and directly dependent Property → Product references. Application paths remain `apps/gamenix-api` and `apps/gamenix-batch`. Schemas remain in `src/schemas`; the user's explicit instruction not to relocate them overrides the placement guidance in AGENTS.md.

- Member now uses USER / ADMIN / SHOP and `memberProducts`; authentication fields and behavior are preserved.
- Product replaces Property in the existing module/resolver/service, DTOs, enums and model registration. The persisted fields match the supplied ER model, with ten product categories and integer, nonnegative `productLeftCount`. Housing fields, housing filters and the cross-shop housing unique index are removed.
- Existing catalog operations now use Product names: `createProduct`, `getProduct`, `updateProduct`, `getProducts`, `getShopProducts`, `likeTargetProduct`, `getAllProductsByAdmin`, `updateProductByAdmin`, `removeProductByAdmin`. `getFavorites` and `getVisited` retain their names and return Products. Ownership is still assigned from authenticated context and checked on ordinary updates.
- User-approved lifecycle mapping: PROCESS means active, FINISHED means sold, and `deletedAt` means deleted. PAUSE remains an editable, nondeleted listing. Public listing/detail/like and batch ranking select PROCESS with `deletedAt: null`. Sale/deletion timestamps are persisted. Existing admin purge only removes already soft-deleted records. No inventory deduction or checkout was added.
- Order, OrderItem and Event schemas, object DTOs, input/update DTOs and enums exist. Their collections are `order`, `orderItems`, and `events`. They have no application modules, registered providers, resolvers or business services yet; these definitions do not expose new order/event operations.
- EventParticipant schema, object/input/update DTOs and registered ParticipantStatus enum are complete. The user confirmed REGISTERED / CANCELLED; new records default to REGISTERED. `eventId` refs Event and `memberId` refs Member. Collection `eventParticipants` has a unique `(eventId, memberId)` index, including cancelled records. Member assignment is internal to the input, consistent with existing ownership DTOs; updates expose only `_id` and optional status. No registration module/service/resolver or application model provider was added.
- Comment/like/view/notification targets and product joins/counters/batch references were adapted directly. Community and socket behavior were preserved. `getAgents`, `AgentsInquiry`, `availableAgentSorts`, `batchTopAgents` and `BATCH_TOP_AGENTS` intentionally retain their existing names and now select SHOP.

Relationships: Product.memberId → Member; Order.memberId/shopId → Member; OrderItem.orderId → Order and productId → Product; Event.eventOrganizer → Member; EventParticipant.eventId → Event and memberId → Member; Notification.productId → Product. Mongoose refs do not enforce SHOP membership, item/order consistency or single-shop orders by themselves; new order/event authorization belongs to the next approved phase.

Compatibility: this is a breaking source/GraphQL contract change. No live database or client migration was executed. Existing AGENT documents/JWTs, properties collections, memberProperties counters, PROPERTY groups and notification propertyId fields need an explicitly reviewed migration before reuse. Existing authentication/guard weaknesses remain outside this phase. Catalog/member counters retain their existing nontransactional behavior.

Validation and the complete file inventory are recorded in [COMPLETED_TASKS.md](COMPLETED_TASKS.md). Phase 1 ER data definitions are complete and validated. Registration behavior and all Phase 2 work remain unimplemented. Phase 2 has not started.

## Historical snapshot — retained for migration history

The following records describe earlier repository states and proposals. Current status and accepted decisions above take precedence. Earlier validation records remain historical.

Snapshot: 2026-10-09 (Asia/Seoul). Source: repository inspection, `AGENTS.md`, and the attached documentation request. No earlier implementation session history was supplied. Source presence is not runtime verification; see [COMPLETED_TASKS.md](COMPLETED_TASKS.md).

## Context and status

Nestar is the original real estate marketplace using NestJS, code-first GraphQL/Apollo, MongoDB/Mongoose, and a separately described Next.js frontend. Gamenix targets a multi-shop gaming equipment marketplace and community: users buy products, independent shops manage stock and organize tournaments/giveaways, and members retain articles, comments, likes, views, follows, and real-time communication.

**Project naming is now Gamenix.** The apps are `gamenix-api` / `gamenix-batch`; package metadata, scripts, configuration, absolute imports and greeting labels were renamed without restructuring or changing domain logic. The catalog still uses properties and AGENT. No product/order/event/participant implementation was found. Domain migration remains PLANNED. Both TypeScript checks and API/batch builds passed after the rename; runtime behavior is NOT VERIFIED.

## Existing structure and naming plan

| Current evidence | Target / action | Status |
|---|---|---|
| `apps/nestar-api/src` | `apps/gamenix-api/src` | COMPLETED |
| `apps/nestar-batch/src` | `apps/gamenix-batch/src` | COMPLETED |
| `package.json`: former name `nestar`, Nestar start/output paths | Gamenix package and scripts; lockfile root metadata updated | COMPLETED |
| `nest-cli.json`: former Nestar projects and tsconfig paths | Coordinated app/config rename | COMPLETED |
| `components/property/property.{module,resolver,service}.ts` | Product module/resolver/service | PLANNED |
| `libs/dto/property/`, `libs/enums/property.enum.ts` | Product DTOs/enums under `libs` | PLANNED |
| `src/schemas/Property.model.ts` | Product schema | PLANNED; schema placement needs reconciliation |
| `MemberType.AGENT`, `AgentsInquiry`, `getAgents` | `MemberType.SHOP`, `ShopsInquiry`, `getShops` | PLANNED |
| `memberProperties`, `batchTopProperties`, `batchTopAgents` | Product counters and product/shop ranking | PLANNED; exact names pending |

Paths in the table are relative to `apps/gamenix-api/src` unless an app/root path is given. Both apps retain NestJS modules, dependency injection, controllers/services, and API resolvers. `components/components.module.ts` imports member, auth, property, board-article, comment, like, view, and follow modules. `app.module.ts` adds database, code-first GraphQL (`autoSchemaFile: true`), and socket modules. API `main.ts` installs validation, uploads, static uploads, and `WsAdapter`.

Current schemas live in `src/schemas`, whereas `AGENTS.md` directs DTOs, enums, and schemas under the target API `src/libs`. Resolve placement before a coordinated code change; documentation does not move files.

## Catalog, DTOs, enums, and service behavior

| Existing property contract | Target product contract | Migration note |
|---|---|---|
| `Property`, `Properties` | `Product`, `Products` | Proposed names; preserve pagination/enrichment patterns |
| `PropertyInput`, `PropertyUpdate` | `ProductInput`, `ProductUpdate` | Replace validation and GraphQL fields together |
| `PropertiesInquiry`, `AgentPropertiesInquiry`, `AllPropertiesInquiry` | Product, shop-product, admin inquiries | Rename clients and sort allowlists together |
| `propertyType`: APARTMENT / VILLA / HOUSE | `productType`: gaming category enum | Confirmed target values below |
| Title, price, images, description | Product title, price, images, description | Proposed `product*` names |
| Rooms, beds, square, rent, barter, construction date, property address/location | Remove real-estate fields | Shipping/shop address is a separate design question |
| `propertyStatus`: ACTIVE / SOLD / DELETE | Product lifecycle | Exact target statuses pending; SOLD is not stock management |
| `memberId` → Member | Shop ownership → Member with SHOP role | Owner field name pending |
| No stock field | `productLeftCount` | Confirmed target; implementation absent |

Target categories: `KEYBOARD`, `MOUSE`, `MONITOR`, `AUDIO`, `CHAIR`, `DESK`, `CONTROLLER`, `ACCESSORY`, `GPU`, `GAMING_PHONE`.

`components/property/property.service.ts` currently creates properties, updates member property counts, restricts ordinary updates to the owning member and ACTIVE status, builds real-estate filters, tracks views/likes, and supports favorites, visits, agent listings, and admin operations. Reuse these patterns while replacing domain semantics. Filters currently include location, rooms, beds, types, dates, prices, squares, text, and rent/barter options. Product filters and indexes need a new contract; they have not been implemented.

The current compound unique property index uses type/location/title/price without ownership. Do not copy it unchanged into a multi-shop catalog: independent shops must be able to list similar equipment.

## GraphQL operation migration

All target names below are proposed, not available operations. Current code-first DTOs define inputs/outputs; no running schema was introspected.

| Current resolver operation | Proposed Gamenix operation |
|---|---|
| `createProperty`, `getProperty`, `updateProperty` | `createProduct`, `getProduct`, `updateProduct` |
| `getProperties` | `getProducts` |
| `getAgentProperties` | `getShopProducts` |
| `likeTargetProperty(propertyId)` | `likeTargetProduct(productId)` |
| `getAllPropertiesByAdmin` | `getAllProductsByAdmin` |
| `updatePropertyByAdmin`, `removePropertyByAdmin` | `updateProductByAdmin`, `removeProductByAdmin` |
| `getAgents` | `getShops` |
| `getFavorites`, `getVisited` returning `Properties` | Preserve names if useful; return product DTOs |

Coordinate field/argument names, inquiry types, enum registration names, resolver return types, service signatures, and frontend documents. Preserve auth/member/community operations where semantics stay valid. Orders/events will need new contracts; none exist to rename.

## MongoDB collections and relationships

This is a schema/source audit, not a live database inventory.

| Current source | Intended collection | Evidence / gap |
|---|---|---|
| `schemas/Member.model.ts`: `members` | `members` | USER / AGENT / ADMIN today; SHOP pending |
| `schemas/Property.model.ts`: `properties` | `products` | `memberId` refs Member; all catalog migration pending |
| None found | `order` | Single-shop order header planned; singular name supplied by user |
| None found | `orderItems` | Order/product/quantity relationship planned |
| None found | `events` | Shop organizer and tournament/giveaway kind planned |
| None found | `eventParticipants` | Event/member relationship planned |
| `schemas/BoardArticle.model.ts`: `boardArticles` | `boardArticles` | Preserve community |
| `schemas/Comment.model.ts`: `comments` | `comments` | Property comment group/service coupling needs migration |
| `schemas/Like.model.ts`: `likes` | `likes` | Unique member/reference index; PROPERTY group needs migration |
| `schemas/View.model.ts`: `views` | `views` | Unique member/reference index; PROPERTY group needs migration |
| `schemas/Follow.model.ts`, registered as Follow | `follows` | Default Mongoose naming, no explicit collection option |
| `schemas/Notification.model.ts`: `notifications` | `notifications` | Schema exists with Property ref; no dedicated feature module found |
| `schemas/Notice.model.ts`: `notices` | `notices` | Schema exists; no dedicated feature module found |

No collection/data migration ran. Decide whether existing records must be retained before changing collection names, enum values, group discriminators, or references. Like/view aggregation joins currently use literal `properties`; notification references and comment counters also depend on Property. Batch imports API models directly and ranks properties/agents, so both apps must change together.

## Ownership, inventory, and orders

Confirmed target: independent SHOP members own products. Current creation is AGENT-only via `PropertyResolver`; the resolver injects the authenticated owner, and ordinary updates filter by owner. SHOP authorization is not implemented.

Confirmed target: an order can contain multiple products, all from one shop. There is no cart/order/stock implementation. Proposed approach: resolve products server-side, verify availability and common owner, calculate authoritative prices, and validate positive integral quantities. Maintain nonnegative `productLeftCount` through conditional stock updates and an agreed atomic order-writing strategy. Order item price snapshots, checkout idempotency, reservation/decrement timing, cancellation/restocking, and transaction support remain pending decisions.

## Events and participants

Confirmed target: shops organize tournaments and giveaways, users register, duplicate registration is prevented. No event enum/DTO/schema/module/resolver/service or participant implementation was found. Proposed reusable architecture: event module with SHOP ownership, participant module with authenticated registration, event eligibility checks, and a database unique event/member index. Capacity, deadlines, cancellation/re-registration, giveaway winner selection, and exact fields/operation names remain pending.

## WebSockets

Existing `socket/socket.gateway.ts` uses NestJS WebSockets with `ws`; `main.ts` installs `WsAdapter`. It verifies a token from the connection URL, stores client/member associations in a Map, permits Guest connections, broadcasts `info` and `message`, and sends `getMessages` with the last five in-memory messages. It logs the token. There are no customer/shop rooms, persistent conversations, or per-conversation authorization in this gateway.

Customer/shop chat is PLANNED. Preserve reusable gateway/auth infrastructure, then define conversation membership, recipient routing, guest policy, message validation, persistence/retention, reconnect behavior, and secure token handling. Existing global broadcast is not private customer/shop chat.

## Compatibility and blockers

Legacy real-estate references remain in property DTOs/enums/models, member counters/agent search, community groups/joins, notification refs and batch ranking. Active project/config/import/greeting references now use Gamenix; Nestar is retained in documentation as migration history. No compatibility aliases or deployment/data conversion policy was found.

Additional static findings requiring focused follow-up: signup accepts caller-supplied `memberType`; ordinary `MemberUpdate` exposes role/status and the service forwards input to MongoDB. This creates a privilege-change risk. `RolesGuard` accesses `authMember.memberType` before its null check. Property status updates compute local timestamps without assigning them to the persisted update input. These are source findings, not reproduced runtime results.

See [DECISIONS.md](DECISIONS.md) for pending choices and [NEXT_STEPS.md](NEXT_STEPS.md) for dependency order.
