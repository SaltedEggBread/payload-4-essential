# Payload 4.0.0-beta.2 → 4.0.0-beta.12: what this repo must act on

Researched 2026-11-25. Scope: changes after `v4.0.0-beta.2` up to and including `v4.0.0-beta.12`.

Sources read:

- All ten GitHub releases, `v4.0.0-beta.3` … `v4.0.0-beta.12` (`gh release view`), plus the linked PRs for every breaking change and for anything touching MCP, auth, uploads/storage, Postgres or peer ranges.
- The v4 migration guide **source** at tags `v4.0.0-beta.2` and `v4.0.0-beta.12`, diffed against each other ([docs/migration-guide/v4.mdx @ beta.12](https://github.com/payloadcms/payload/blob/v4.0.0-beta.12/docs/migration-guide/v4.mdx)). The rendered page at https://payloadcms.com/docs/beta/migration-guide/v4 was **not** fetched; the markdown source at the release tag was used instead.
- The MCP plugin docs source at the tag ([docs/plugins/mcp.mdx @ beta.12](https://github.com/payloadcms/payload/blob/v4.0.0-beta.12/docs/plugins/mcp.mdx)).
- Published npm tarballs (`npm pack`, read only, not installed) of `payload`, `@payloadcms/plugin-mcp`, `@payloadcms/storage-s3`, `@payloadcms/plugin-cloud-storage` and `@payloadcms/ui` at `4.0.0-beta.12` (and `beta.2` for diffs), and `npm view <pkg>@4.0.0-beta.12 peerDependencies engines`.

## Summary

**Verdict: medium risk.** Nothing forces a rewrite, but the bump is not drop-in:

1. **Peer/engine floors moved.** `@payloadcms/next@4.0.0-beta.12` requires `next >=16.4.5 <17.0.0` (repo: `16.4.2`), and every package requires Node `^24.22.3 || >=26.13.1` (repo declares `>=24.15.0`). The install will warn or fail until `next`, `engines.node`, `.node-version` and the README are updated.
2. **A Postgres migration is required.** Sessions gained 5 columns, and upload collections gained `_transforms` and `_stored` columns. `pnpm start` runs migrations on boot, so the migration must be committed.
3. **The import map is stale.** The committed `importMap.js` references `@payloadcms/ui/rsc#RecentlyViewedWidget` and `@payloadcms/ui#RecentlyViewedCollectionsField`, which were renamed in beta.4. The MCP plugin also adds a new admin view. `generate:importmap` must be rerun.
4. **The MCP plugin now ships its own OAuth server and turns it on by default** (beta.8). The repo's custom `mcp-oauth` layer keeps working because it sets `overrideGetAuthorizedMCP`, which still replaces the default flow. But the plugin's second, unused authorization server is now live under `/api/mcp/oauth/*` and `/api/mcp/oauth-protected-resource`. Set `oauth: false` unless you plan to migrate to the built-in server.
5. Two releases (beta.7, beta.12) are flagged "Contains vital security updates", including draft and read-access fixes that matter for this repo's no-public-drafts guarantee.

### Action list (short)

1. Bump every `payload` / `@payloadcms/*` to exactly `4.0.0-beta.12`.
2. Bump `next` (and `eslint-config-next`) to `>=16.4.5`; `16.4.6` is the latest 16.4.x on npm.
3. Raise `engines.node` to `^24.22.3 || >=26.13.1`, and make sure `.node-version` / Railway resolve to ≥ 24.22.3.
4. Run `corepack pnpm migrate:create` and commit the migration.
5. Run `generate:types` and `generate:importmap` and commit the results.
6. Add `oauth: false` to the MCP plugin options, or deliberately adopt the built-in server.
7. Update the README `Version Info` section (Payload, Next.js, Node.js).
8. Run `typecheck` and the full `test:e2e`, including the OAuth specs.

## Action checklist for this repo

| # | Action | Files | Source |
|---|---|---|---|
| 1 | Pin all 15 `payload` / `@payloadcms/*` entries to `4.0.0-beta.12` | `package.json`, `pnpm-lock.yaml` | [beta.12 release](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.12) |
| 2 | `next` `16.4.2` → `16.4.6` (peer is `>=16.4.5 <17.0.0`). Keep `eslint-config-next` on the same version | `package.json` | [PR #19672](https://github.com/payloadcms/payload/pull/19672), [beta.10 release](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.10), `npm view @payloadcms/next@4.0.0-beta.12 peerDependencies` |
| 3 | `engines.node` `>=24.15.0` → `^24.22.3 \|\| >=26.13.1`. `.node-version` currently says `24`; pin `24.22.3` or confirm Railway resolves a patched 24.x | `package.json`, `.node-version` | [PR #19555](https://github.com/payloadcms/payload/pull/19555), [PR #18946](https://github.com/payloadcms/payload/pull/18946), `npm view payload@4.0.0-beta.12 engines` |
| 4 | React stays `19.3.1`, which already satisfies the new `^19.3.1` peer. No change | `package.json` | [PR #19460](https://github.com/payloadcms/payload/pull/19460) |
| 5 | **Create a migration** (`corepack pnpm migrate:create <name>`). Expected contents: `users_sessions` + `refresh_count`, `refreshed_at`, `label`, `type`, `details`; `media` and `_media_v` + `_transforms` (JSON) and `_stored` columns for the main file, `original` and each variant. Review the generated SQL | `src/migrations/*` (new), `src/migrations/index.ts` | [PR #19040](https://github.com/payloadcms/payload/pull/19040), [PR #19492](https://github.com/payloadcms/payload/pull/19492), [PR #19081](https://github.com/payloadcms/payload/pull/19081), [PR #19179](https://github.com/payloadcms/payload/pull/19179), [guide: Database migrations](https://github.com/payloadcms/payload/blob/v4.0.0-beta.12/docs/migration-guide/v4.mdx) |
| 6 | Regenerate the import map. The current one imports `RecentlyViewedWidget` / `RecentlyViewedCollectionsField`, which were renamed to `ActivityWidget` / `CollectionFilter`. The plugin also registers `@payloadcms/plugin-mcp/rsc#MCPAuthorizeView` | `src/app/(payload)/admin/importMap.js` (lines 46–47, 98–99) | [PR #18790](https://github.com/payloadcms/payload/pull/18790) (in [beta.4](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.4)), [PR #19036](https://github.com/payloadcms/payload/pull/19036), plugin-mcp beta.12 `dist/index.js` |
| 7 | Regenerate types: the `User` sessions shape, the `Media` `_transforms` / `_stored` fields, and `never` for empty supported timezones | `src/payload-types.ts` | [PR #19492](https://github.com/payloadcms/payload/pull/19492), [PR #19081](https://github.com/payloadcms/payload/pull/19081), [PR #19881](https://github.com/payloadcms/payload/pull/19881) |
| 8 | **Disable the MCP plugin's built-in OAuth server** (`oauth: false` in `mcpPlugin({...})`, or `mcp.options.oauth ??= false` inside `mcpOAuthPlugin`). Otherwise `/api/mcp/oauth-protected-resource` and `/api/mcp/oauth/{register,authorize,token,jwks,.well-known/openid-configuration}` advertise a second issuer whose tokens the repo's override rejects. The alternative is to evaluate replacing `src/plugins/mcp-oauth` with the built-in server, checked against the AGENTS.md OAuth guarantees | `src/plugins/mcp.ts` or `src/plugins/mcp-oauth/index.ts` | [PR #19036](https://github.com/payloadcms/payload/pull/19036), [PR #18722](https://github.com/payloadcms/payload/pull/18722), [mcp.mdx §OAuth](https://github.com/payloadcms/payload/blob/v4.0.0-beta.12/docs/plugins/mcp.mdx) |
| 9 | Re-verify the MCP OAuth e2e: `/api/mcp` is now registered with `disableAuth: true`, so `req.user` is `null` on entry, and GET now goes through auth (401 when signed out, 405 when signed in) | `tests/e2e/oauth.spec.ts`, `src/plugins/mcp-oauth/server/mcpAuth.ts` | [PR #18761](https://github.com/payloadcms/payload/pull/18761), [PR #19319](https://github.com/payloadcms/payload/pull/19319) |
| 10 | Optional: `SameOriginBounce` may no longer be needed, because Payload now accepts the auth cookie on cross-site top-level GET navigations. Keep it until e2e proves otherwise | `src/plugins/mcp-oauth/next/SameOriginBounce.tsx`, `AuthorizePage.tsx` | [PR #19329](https://github.com/payloadcms/payload/pull/19329) |
| 11 | Optional: seed Lexical content sets `direction: 'ltr'` explicitly, which now renders `dir="ltr"` on the frontend. This is harmless for an LTR site; set it to `null` if you want inherited direction | `src/endpoints/seed/lexical.ts`, `contact-form.ts`, `contact-page.ts` | [PR #19651](https://github.com/payloadcms/payload/pull/19651), guide "Lexical converters render the saved text direction" |
| 12 | Update README `Version Info`: Payload `4.0.0-beta.12`, Next.js `16.4.6`, Node `^24.22.3 \|\| >=26.13.1` | `README.md` (lines 31–34) | AGENTS.md rule; sources above |
| 13 | Run `corepack pnpm typecheck` and `corepack pnpm test:e2e` | — | AGENTS.md |

## Per-release notes

Only items relevant to this stack are listed. TanStack-, MongoDB-, multi-tenant-, Azure- and GCS-only items are omitted unless noted.

### beta.3 — [release](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.3)

- **Breaking:** TanStack Start uses React Flight ([#18787](https://github.com/payloadcms/payload/pull/18787)). **Not used here** (Next.js app).
- Feature: Next.js `cacheComponents` is supported, and the admin renders at request time when it is on ([#18702](https://github.com/payloadcms/payload/pull/18702), [#18694](https://github.com/payloadcms/payload/pull/18694)). `next.config.ts` does not enable `cacheComponents`, so this is **not used here**.
- Perf: the drizzle `_locales` unique index now leads with `_parent_id`, which needs a migration on localized DBs ([#18723](https://github.com/payloadcms/payload/pull/18723)). **Not used here:** no `localization` config in `src/payload.config.ts`.
- Fix: localized fields are validated per locale with `locale: 'all'` ([#18502](https://github.com/payloadcms/payload/pull/18502)). Not used here.

### beta.4 — [release](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.4)

- **Breaking:** minimum Node `24.22.1` ([#18946](https://github.com/payloadcms/payload/pull/18946)). Superseded by beta.9.
- **Breaking:** global version restore returns the global document directly ([#18928](https://github.com/payloadcms/payload/pull/18928)). **Not used here:** no `restoreGlobalVersion` in `src/`.
- **Rename (affects the import map):** the recents widget is now the activity widget, so `@payloadcms/ui/rsc#RecentlyViewedWidget` → `#ActivityWidget` and `@payloadcms/ui#RecentlyViewedCollectionsField` → `#CollectionFilter` ([#18790](https://github.com/payloadcms/payload/pull/18790)). **Applies:** `src/app/(payload)/admin/importMap.js`. The widget slug stays `activity` (checked in the `payload` beta.2 and beta.12 dist), so `dashboard.defaultLayout` in `src/payload.config.ts` is fine.
- Fix: the document id is passed to field access ([#18270](https://github.com/payloadcms/payload/pull/18270)); `undici` bumped ([#18949](https://github.com/payloadcms/payload/pull/18949)); `ui` keeps published content when restoring drafts ([#18394](https://github.com/payloadcms/payload/pull/18394)).

### beta.5 — [release](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.5)

- **Breaking:** extra `uploadReference` fields go into `clientData` (for custom storage adapters only, "No first-party adapter is affected") ([#19033](https://github.com/payloadcms/payload/pull/19033)). **Not used here** (stock `s3Storage`).
- Fix: public upload receipts with signed `adapterData` ([#19032](https://github.com/payloadcms/payload/pull/19032)); reset password runs the password field's validation ([#19006](https://github.com/payloadcms/payload/pull/19006)); GraphQL excludes hidden fields from mutation inputs ([#18862](https://github.com/payloadcms/payload/pull/18862)). The last one is relevant to the hidden `oauth-*` collections, as defence in depth.

### beta.6 — [release](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.6)

- **Breaking:** Lexical upgraded to `0.53.0`. Node traversal generics are removed, the `*ImportExtension` exports are removed, and Markdown export escapes brackets ([#19176](https://github.com/payloadcms/payload/pull/19176)). The PR states "No database migration is needed". **Not used here:** no `getParent<`, `getChildren<`, `$getNodeByKey<`, `*ImportExtension` or `convertLexicalToMarkdown` in `src/`.
- Feature: the admin always restores versions as drafts ("Restore as draft" replaces the restore dropdown) ([#18892](https://github.com/payloadcms/payload/pull/18892)). This is a UI behaviour change; no e2e spec in `tests/e2e` references restore.
- Deps: `sharp` 0.35.5 ([#19117](https://github.com/payloadcms/payload/pull/19117)). `@payloadcms/transformer-sharp@4.0.0-beta.12` depends on exact `sharp: 0.35.5` (`npm view`). Run `corepack pnpm deps:native` after install.
- Chore: `plugin-mcp` MCP SDK 2.4.0 ([#19038](https://github.com/payloadcms/payload/pull/19038)).

### beta.7 — [release](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.7) — "Contains vital security updates"

- **Breaking (schema): refresh tokens** ([#19040](https://github.com/payloadcms/payload/pull/19040)). Every auth collection with `useSessions` (the default) gains the session fields `refreshCount` and `refreshedAt`, "whether or not it enables `refreshTokens`". On Postgres this adds two columns to `<collection>_sessions`, so a migration is needed. **Applies:** `users` (`src/collections/Users/index.ts`, `auth: { useAPIKey: true }`, sessions on by default).
- **Breaking:** the `-original` suffix is removed from retained upload originals; `?original=true` replaces it, and `getOriginalFilename` is removed from `payload/internal` ([#19210](https://github.com/payloadcms/payload/pull/19210)). **Not used here:** no `-original` or `getOriginalFilename` references in `src/` or `tests/`. `getMediaUrl` already handles URLs that carry a query string.
- Security fixes (no PR numbers, commits only): `pasteURL` restrictions enforced on remote uploads ([7097df5](https://github.com/payloadcms/payload/commit/7097df5)); block child read access enforced in queries ([45e833f](https://github.com/payloadcms/payload/commit/45e833f)); blocks restricted to configured types ([5496b16](https://github.com/payloadcms/payload/commit/5496b16)); Lexical HTML converters escape stored values ([b138053](https://github.com/payloadcms/payload/commit/b138053)); the `next` og endpoint clamps the description ([4e2f324](https://github.com/payloadcms/payload/commit/4e2f324)).
- Fix: cookie auth falls back to the `Referer` origin when `Sec-Fetch-Site` is absent ([#17897](https://github.com/payloadcms/payload/pull/17897)); `_strategy` is set for custom auth strategies ([#19313](https://github.com/payloadcms/payload/pull/19313)).
- Feature: `auth.passwordHashIterations` ([#19070](https://github.com/payloadcms/payload/pull/19070)); `sessionExpiration` on `addSessionToUser` ([#19046](https://github.com/payloadcms/payload/pull/19046)).

### beta.8 — [release](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.8)

- **Breaking (deps):** React `^19.3.1`, Next `>=16.4.1 <17` ([#19460](https://github.com/payloadcms/payload/pull/19460)). React is already OK; Next was raised again in beta.10.
- **Breaking:** endpoints can set `disableAuth`; the deprecated `root` property is removed from `Endpoint` ([#18761](https://github.com/payloadcms/payload/pull/18761)). `root` is **not used here** (`src/payload.config.ts` `/health` endpoint, `src/plugins/mcp-oauth/endpoints.ts`). Side effect: plugin-mcp now registers `/mcp` with `disableAuth: true` (plugin-mcp beta.12 `dist/index.js`), so `req.user` is `null` when `getAuthorizedMCPWithOAuth` runs. The repo's resolver authenticates on its own (Bearer, or `payload.auth` for API keys), so it should still work. Verify with e2e.
- **Breaking:** form-state utilities renamed `reduceFieldsToValues` → `getDataFromFormState` and `getSiblingData` → `getSiblingDataFromFormState` ([#19425](https://github.com/payloadcms/payload/pull/19425)). **Not used here.**
- **Breaking:** `Form` owns the form-state request lifecycle, and `onChange`/`onSuccess` return values are ignored ([#19343](https://github.com/payloadcms/payload/pull/19343)). **Not used here:** no `<Form` / `getFormState` in `src/`.
- **MCP plugin, large change:**
  - Optional `oauth` setting; signed-out requests get a 401 with `WWW-Authenticate` pointing at `/api/mcp/oauth-protected-resource` ([#18722](https://github.com/payloadcms/payload/pull/18722)).
  - `oauth.authenticate` hook ([#18757](https://github.com/payloadcms/payload/pull/18757)).
  - **Built-in OAuth server, on by default** (`oauth: { type: 'builtin' }` is the default). It adds the endpoints `/api/mcp/oauth/.well-known/openid-configuration`, `/jwks`, `/register`, `/authorize` (GET+POST) and `/token`, plus an admin view at `/admin/mcp/authorize` ([#19036](https://github.com/payloadcms/payload/pull/19036); paths confirmed in plugin-mcp beta.12 `dist/endpoint/oauthServer.js`).
  - GET `/api/mcp` now goes through the sign-in check ([#19319](https://github.com/payloadcms/payload/pull/19319)).
  - **How this affects `src/plugins/mcp-oauth`:** `overrideGetAuthorizedMCP` is still honoured and "replaces the default authentication flow, including the plugin's `access`" (plugin-mcp beta.12 `dist/types.d.ts`; `dist/endpoint/access.js` returns early when it is set). The repo's paths (`/api/oauth/*`, `/.well-known/*` route handlers, `/admin/connected-apps`) do not collide with the plugin's (`/api/mcp/oauth/*`, `/api/mcp/oauth-protected-resource`, `/admin/mcp/authorize`).
  - The built-in endpoints stay live unless `oauth: false`. They are gated only on `oauth.type === 'builtin'` (`withIssuer` in `oauthServer.js`, `getMetadataResponse` in `oauth.js`). A client that finds them would get a token the repo's resolver rejects, and the plugin would still create a `type: 'mcp'` session on the user. **Recommended action #8.**
  - The built-in tool keys are unchanged between beta.2 and beta.12 (`dist/mcp/builtinTools.d.ts` is identical), so `noMCPTools` in `src/plugins/mcp-oauth/index.ts` still hides every tool on the `oauth-*` collections. `@payloadcms/plugin-mcp/internal` still exports `filterMCPItems`.
- **Schema:** upload collections gain a `_transforms` JSON field ([#19081](https://github.com/payloadcms/payload/pull/19081)) and core-controlled `_stored` fields on main, `original` and variants ([#19179](https://github.com/payloadcms/payload/pull/19179)); both need a migration on Postgres. **Applies:** `media` (`src/collections/Media.ts`) and its `_media_v` versions table. `_transforms` and `_stored` are now reserved names; Media defines neither.
- Request-time variants for transformers without stored sizes ([#19299](https://github.com/payloadcms/payload/pull/19299)) and the transformer `_transforms` contract ([#19145](https://github.com/payloadcms/payload/pull/19145), [#19122](https://github.com/payloadcms/payload/pull/19122)). Sharp still stores sizes, so there is no expected behaviour change here.
- Fix: drizzle preserves input during write transformation ([#19483](https://github.com/payloadcms/payload/pull/19483)); `ui` shows the original file in the upload preview ([#19362](https://github.com/payloadcms/payload/pull/19362)).

### beta.9 — [release](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.9)

- **Breaking:** Node `^24.22.3 || >=26.13.1` ([#19555](https://github.com/payloadcms/payload/pull/19555)). **Applies:** `package.json` `engines`, `.node-version`, README. Local `node -v` on this machine is `v24.22.3`.
- **Breaking (schema):** sessions gain `label`, `type` and `details`, adding three columns to `<collection>_sessions` ([#19492](https://github.com/payloadcms/payload/pull/19492)). **Applies:** `users_sessions` (created in `src/migrations/20261017_160636_initial.ts` with only `_order`, `_parent_id`, `id`, `created_at`, `expires_at`).
- Features: crop/focal point read from `_transforms` ([#19547](https://github.com/payloadcms/payload/pull/19547)); historical upload variants and transform replay on restore ([#19474](https://github.com/payloadcms/payload/pull/19474)).
- Fix: drizzle limits atomic updates with a locking subquery ([#19214](https://github.com/payloadcms/payload/pull/19214)); transaction failures preserved and sessions cleaned up ([#19159](https://github.com/payloadcms/payload/pull/19159)).

### beta.10 — [release](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.10)

- **Breaking (deps):** Next `>=16.4.5` ("fixes seven security advisories from the November 2026 Next.js security release") ([#19672](https://github.com/payloadcms/payload/pull/19672)). **Applies:** `next` `16.4.2` is below the floor.
- **Breaking:** cookie prefixes are normalized; `''` becomes `payload` and invalid characters throw ([#19588](https://github.com/payloadcms/payload/pull/19588)). **Not used here:** no `cookiePrefix` set in `src/payload.config.ts`. `src/plugins/mcp-oauth/endpoints.ts:409` passes `req.payload.config.cookiePrefix` to `generateExpiredPayloadCookie` (still exported in beta.12, same signature in `dist/auth/cookies.d.ts`), so it picks up the normalized value automatically.
- **Breaking:** Lexical HTML/JSX converters render an explicit `direction` as `dir` ([#19651](https://github.com/payloadcms/payload/pull/19651)). **Applies (cosmetic):** seed content in `src/endpoints/seed/*.ts` sets `direction: 'ltr'`. Custom JSX converters in `src/components/RichText` get a `dir` prop injected through `cloneElement`.
- **Breaking:** `ui` theme providers split, `useRootTheme`, setters lose their options argument ([#19564](https://github.com/payloadcms/payload/pull/19564)). **Not used here:** `src/providers/Theme` is the frontend's own provider, not `@payloadcms/ui`'s.
- **Breaking:** `useQueue().queueTask` takes `{ task, priority }` ([#19203](https://github.com/payloadcms/payload/pull/19203)). **Not used here.**
- Feature: **`mcpPlugin({ access })`** limits who can use MCP ([#19629](https://github.com/payloadcms/payload/pull/19629)). It is replaced by `overrideGetAuthorizedMCP`, so it would have **no effect** with the repo's override.
- Feature: S3 resumable upload sessions ([#19325](https://github.com/payloadcms/payload/pull/19325)) add a hidden `payload-upload-sessions` collection and table **only when `clientUploads` is enabled**. In plugin-cloud-storage beta.12 `dist/plugin.js`, `uploadInstructions` (including `segmented`) is attached only `if (enabled)`, and `payload` `dist/config/sanitize.js` adds the collection only for collections with `uploadInstructions.segmented`. **Not used here:** `src/config/storage.ts` does not set `clientUploads`. The `s3Storage` options type is otherwise unchanged (only a doc comment differs between beta.2 and beta.12 `dist/index.d.ts`).
- Fix: cookie auth is accepted on cross-site top-level navigations ([#19329](https://github.com/payloadcms/payload/pull/19329)). Relevant to the OAuth consent page; see action #10.
- Fix: `db-postgres` reuses transactions for document lock checks ([#19551](https://github.com/payloadcms/payload/pull/19551)); drizzle `point` field version bug ([#19332](https://github.com/payloadcms/payload/pull/19332)); `onInit` re-runs when initialization is retried ([#19619](https://github.com/payloadcms/payload/pull/19619)).

### beta.11 — [release](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.11)

- No section marked breaking.
- `db-postgres`: identifier names over 63 characters are shortened with a hash, and existing DBs get a one-time drop and re-add of those indexes and FKs ([#15529](https://github.com/payloadcms/payload/pull/15529)). **Likely not applicable:** the longest index or constraint name in `src/migrations/*.ts` is 60 characters, so no name exceeds 63. Confirm with the generated migration.
- Drizzle: localized status schema aligned with its migration ([#18089](https://github.com/payloadcms/payload/pull/18089)) (not used: no localization); omitted arrays preserved in partial updates ([#19691](https://github.com/payloadcms/payload/pull/19691)); orphaned `_rels` rows deleted when arrays or blocks shrink ([#18193](https://github.com/payloadcms/payload/pull/18193)). The last two are data-integrity fixes relevant to `pages` layout blocks.
- Isolated access constraints for polymorphic joins ([#19678](https://github.com/payloadcms/payload/pull/19678)); vulnerable `deepmerge` removed ([#19265](https://github.com/payloadcms/payload/pull/19265)).

### beta.12 — [release](https://github.com/payloadcms/payload/releases/tag/v4.0.0-beta.12) — "Contains vital security updates"

- No section marked breaking.
- Security-relevant fixes (commits only), which strengthen the repo's "no public drafts / no commenter emails" guarantees:
  - Related collection read constraints apply to nested hasMany relationship queries ([ac1f8fe](https://github.com/payloadcms/payload/commit/ac1f8fe)).
  - Related read access applies to draft find filters ([5266ec5](https://github.com/payloadcms/payload/commit/5266ec5)).
  - Top-level update operators are stripped before persistence ([c483e21](https://github.com/payloadcms/payload/commit/c483e21)).
  - Formula-prefixed CSV values are neutralized ([4538e6d](https://github.com/payloadcms/payload/commit/4538e6d)).
  - `ui` server function dispatch is restricted to registered handlers ([94f1fa4](https://github.com/payloadcms/payload/commit/94f1fa4)).
  - Version diffs respect read access for relationship labels ([edc4749](https://github.com/payloadcms/payload/commit/edc4749)).
  - Schedule-publish checks publish permission ([0f9412a](https://github.com/payloadcms/payload/commit/0f9412a)). Relevant: the repo uses scheduled publishing via `jobs.autoRun`.
- Types: `never` is generated for empty supported timezones ([#19881](https://github.com/payloadcms/payload/pull/19881)), so `src/payload-types.ts` may change.
- Drizzle: nested block rows are deleted when the parent block is removed ([#19323](https://github.com/payloadcms/payload/pull/19323)); nested array rows stay under their parent ([#19821](https://github.com/payloadcms/payload/pull/19821)).
- Lexical: link editors preserved during autosave ([#19736](https://github.com/payloadcms/payload/pull/19736)).

## Peer dependency / engine table

From `npm view <pkg>@4.0.0-beta.12 peerDependencies engines --json`, compared with `package.json`.

| Requirement | Required by beta.12 | Repo now | OK? |
|---|---|---|---|
| `next` | `>=16.4.5 <17.0.0` (`@payloadcms/next`) | `16.4.2` | **No.** Bump to `16.4.6` |
| `react` / `react-dom` | `^19.3.1` (`@payloadcms/ui`, `@payloadcms/richtext-lexical`); admin-bar and live-preview-react: `^16.8 \|\| ^17 \|\| ^18 \|\| ^19.3.1` | `19.3.1` | Yes |
| Node | `^24.22.3 \|\| >=26.13.1` (`payload`, `next`, `ui`, `richtext-lexical`, `storage-s3`, `transformer-sharp`) | `engines.node: >=24.15.0`; `.node-version: 24` | **No.** Update `engines`; confirm the runtime is ≥ 24.22.3 |
| `graphql` | `^16.8.1` (`payload`, `@payloadcms/next`) | `^16.8.2` | Yes |
| `payload` | exact `4.0.0-beta.12` (all `@payloadcms/*`) | `4.0.0-beta.2` | Bump all together |
| `@payloadcms/ui` | exact `4.0.0-beta.12` (`plugin-mcp`) | `4.0.0-beta.2` | Bump all together |
| `sharp` | not a peer; `@payloadcms/transformer-sharp` depends on exact `0.35.5` | transitive only | Yes. Run `deps:native` |
| TypeScript | no peer declared; the guide says minimum `6.0.3` (unchanged since beta.2) | `6.0.3` | Yes |
| `@payloadcms/db-postgres` | peer `payload: 4.0.0-beta.12`; no `engines` field returned | — | — |

beta.2 baseline for comparison: `@payloadcms/next@4.0.0-beta.2` had peer `next >=16.4.0 <17.0.0` and engines `node >=24.15.0`.

## Migration guide sections new or changed since beta.2

Diff of `docs/migration-guide/v4.mdx` between tags [`v4.0.0-beta.2`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.2/docs/migration-guide/v4.mdx) and [`v4.0.0-beta.12`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.12/docs/migration-guide/v4.mdx). Relevance to this repo is in brackets.

- **New "Database migrations"**: "generate one migration after upgrading with `payload migrate:create`, check it, and run it with `payload migrate`" [applies]
- New "Theme context distinguishes local overrides from root preferences" [not used]
- New "Form-state data utilities are renamed" [not used]
- New "Cookie prefixes are normalized and validated" [not used; no `cookiePrefix`]
- New "`Form` makes its own form-state requests" [not used]
- New "`useQueue` tasks take an options object and report their outcome" [not used]
- New "Lexical converters render the saved text direction" [cosmetic; seed data]
- New "`root` removed from the `Endpoint` type" [not used]
- Changed "Minimum supported Node.js version is now 24.22.3" [applies]
- Changed "Minimum supported Next.js version is now 16.4.5", now also stating React `^19.3.1` [applies: Next]
- Changed Lexical sections: `0.52.0` → `0.53.0`, Markdown escaping, type-argument removal [not used]
- Changed custom storage adapter `uploadReference.clientData` text [not used]
- New "S3 client uploads use resumable upload sessions for large files" [not used; no `clientUploads`]
- Changed "Upload collections retain originals and file history" (no more `-original`) [no code impact]
- New "Upload collections save crop and focal point edits in `_transforms`", which also covers `_stored` [applies: migration]
- The "MCP plugin configuration and authentication have changed" section is **unchanged** between beta.2 and beta.12. It does **not** mention that the built-in OAuth server is on by default; that is only in [mcp.mdx §OAuth](https://github.com/payloadcms/payload/blob/v4.0.0-beta.12/docs/plugins/mcp.mdx) ("Set `oauth: false` to turn this off").

## Open questions / not verified

- **The exact migration SQL was not generated.** That requires installing beta.12 and a database; this was a read-only task. The expected columns come from the PR texts. Run `migrate:create` and review the diff, especially for unexpected index drops or re-adds from [#15529](https://github.com/payloadcms/payload/pull/15529) and [#18723](https://github.com/payloadcms/payload/pull/18723).
- **The "Sessions say what they are" guide section is missing.** [PR #19492](https://github.com/payloadcms/payload/pull/19492) says the change "is in the v4 migration guide under 'Sessions say what they are'", but that heading is not in `v4.mdx` at `v4.0.0-beta.12` or on `main`. Likewise, refresh-token columns ([#19040](https://github.com/payloadcms/payload/pull/19040)) get no dedicated guide section; they are covered only by the generic "Database migrations" paragraph.
- **Railway's Node version is unconfirmed.** It was not verified whether Railway/Railpack resolves `.node-version: 24` to ≥ 24.22.3; Railway was deliberately not touched. Pinning the full version avoids the question.
- **The MCP OAuth behaviour was checked by reading code, not at runtime.** `disableAuth` on `/api/mcp`, GET now hitting the override (401 when signed out), and the error path that merges `req.responseHeaders` (the `WWW-Authenticate` header) into the `UnauthorizedError` response were all read from the published dist. The OAuth e2e specs are the real check.
- **Type compatibility was only checked by symbol presence.** All `payload` symbols imported in `src/` exist in the beta.12 dist (`index.bundled.d.ts`), and `@payloadcms/ui` exports `./elements/*`, `./icons/*` and `./rsc`. Full signature compatibility needs `corepack pnpm typecheck` after install.
- **The built-in MCP OAuth server was not assessed against the AGENTS.md guarantees** (hashed storage, single-use codes and refresh tokens, exact redirect URI matching). It stores sealed state client-side rather than in the database, per the comment in `oauthServer.js`, so replacing `src/plugins/mcp-oauth` with it would need its own review.
- **The rendered docs site was not fetched.** https://payloadcms.com/docs/beta/migration-guide/v4 was not read; the markdown source at the release tag was used instead.
