# Completed tasks and evidence ledger

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
