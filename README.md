# companion-module-warecotech-warecue

A [Bitfocus Companion](https://bitfocus.io/companion) module for **WareCue** — scene playout and multi-display show control. It lets professional techs drive WareCue from their main Stream Deck / Companion stack, with live button feedback.

It speaks WareCue's WebSocket control API (commands + `state.changed` feedback on one connection, default port `8090`).

See [`companion/HELP.md`](companion/HELP.md) for setup, actions, feedbacks, variables and presets.

## Development

```sh
corepack enable      # once — provides the pinned yarn 4
yarn install
yarn build           # compiles src/ to dist/
yarn dev             # recompiles on change
yarn lint            # eslint (includes prettier)
yarn package         # build + bundle into pkg/ and a .tgz, validating the manifest
```

- Source is TypeScript in `src/`; `src/main.ts` is the entry. The layout follows Bitfocus's TypeScript module template (API 1.x).
- Built against [`@companion-module/base`](https://github.com/bitfocus/companion-module-base) 1.x, on **Node 22**.

### Testing in Companion (dev modules)

Companion loads unpublished modules from a folder on disk — there's no upload step for dev builds.

1. Either clone this repo into a folder such as `~/companion-dev-modules/warecotech-warecue/` and run `yarn install && yarn dev` there (Companion loads `dist/`), or unpack a packaged `.tgz` there with `tar xzf warecotech-warecue-*.tgz --strip-components=1`.
2. Keep the parent folder (`~/companion-dev-modules/`) for any other dev modules.
3. In Companion: **Settings → Developer modules path** → point it at `~/companion-dev-modules/`.
4. Add the **WareCue** connection (see [`companion/HELP.md`](companion/HELP.md)) and point it at a running WareCue.

The module reloads automatically when the files change.

## License

[MIT](LICENSE)
