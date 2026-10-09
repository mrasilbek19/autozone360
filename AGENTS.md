# Gamenix365 Backend Agent Instruction

Gamenix365 is a NestJS GraphQL monorepo migrated from a real estate platform into a multi-shop gaming equipment marketplace and community platform.

## Read First

Before changing code, read the current AI handoff docs:

- `docs/ai/BACKEND_MIGRATION.md`
- `docs/ai/DECISIONS.md`
- `docs/ai/COMPLETED_TASKS.md`
- `docs/ai/NEXT_STEPS.md`

Use those files as the source of truth for AI Agent related migration history, accepted decisions, remaining work and validation status.

## Project Shape

- Backend apps are `gamenix365-api` and `gamenix365-batch`.
- Keep the existing NestJS resolver/service/module pattern based on MVC and DI.
- Keep DTOs, enums, schemas under `apps/gamenix365-api/src/libs`.
- Keep shared modules reusable: auth, member, like, view, comment, follow, board article, socket.

## Domain Rules

- Use Gamenix365/product terminology for the main catalog entity.
- Do not reintroduce property or real-estate fields.
- Use `MemberType.USER`, `MemberType.SHOP` and `MemberType.ADMIN`.
- Product ownership belongs to `MemberType.SHOP`.
- Product enum values are:
  - `productType`: `KEYBOARD`, `MOUSE`, `MONITOR`, `AUDIO`, `CHAIR`, `DESK`, `CONTROLLER`, `ACCESSORY`, `GPU`, `GAMING_PHONE`
- Support multiple independent shops selling gaming equipment.
- Each order can contain multiple products, but all products must belong to the same shop.
- Shops can organize tournaments and giveaways.
- Users can register for events, interact with shops, and participate in the gaming community.
- Preserve existing community functionality including articles, comments, likes, views, and follows.
- Use NestJS WebSockets for real-time communication.

## Workflow

1. Analyze before editing.
2. Keep changes small and consistent with existing project patterns.
3. Do not remove working logic unless it is replaced safely.
4. Update `docs/ai/COMPLETED_TASKS.md` after major completed work.
5. Add or update focused tests when behavior changes.

## Validation

Use these checks for backend work:

```bash
npx tsc -p apps/gamenix365-api/tsconfig.app.json --noEmit
npx tsc -p apps/gamenix365-batch/tsconfig.app.json --noEmit
npm run build
```

`npm run lint` runs ESLint with `--fix`, so use it only when file rewriting is acceptable!
