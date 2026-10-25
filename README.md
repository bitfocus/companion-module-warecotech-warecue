# companion-module-warecotech-warecue

A [Bitfocus Companion](https://bitfocus.io/companion) module for **WareCue** — scene playout and multi-display show control. It lets professional techs drive WareCue from their main Stream Deck / Companion stack, with live button feedback.

It speaks WareCue's WebSocket control API (commands + `state.changed` feedback on one connection, default port `8090`).

See [`companion/HELP.md`](companion/HELP.md) for setup, actions, feedbacks, variables and presets.

## Development

```sh
corepack enable      # once — provides the pinned yarn 4
yarn install
yarn package         # bundles + validates the manifest, writes pkg/ and a .tgz
yarn lint            # prettier --check + tsc --noEmit
yarn dev             # rebuild on change
```

- Source is TypeScript in `src/`; `src/main.ts` is the entry.
- Built against [`@companion-module/base`](https://github.com/bitfocus/companion-module-base) 1.x.
- Requires **Node 22** to build — `companion-module-build` relies on Node 22's native TypeScript type-stripping.

### Testing in Companion (dev modules)

Companion loads unpublished modules from a folder on disk — there's no upload step for dev builds.

1. Get a **built** copy of the module (the `pkg/` output, not raw source). Either run `yarn package` locally, or download the **`warecue-module`** artifact from the latest green [Actions run](../../actions) and unzip it.
2. Put it in a folder, e.g. `~/companion-dev-modules/warecotech-warecue/`.
3. In Companion: **Settings → Developer modules path** → point it at `~/companion-dev-modules/`.
4. Add the **WareCue** connection (see [`companion/HELP.md`](companion/HELP.md)) and point it at a running WareCue.

The module reloads automatically when the files change.

## License

[MIT](LICENSE)
