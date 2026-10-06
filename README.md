# companion-module-warecotech-warecue

A [Bitfocus Companion](https://bitfocus.io/companion) module for **WareCue** — scene playout and multi-display show control. It lets professional techs drive WareCue from their main Stream Deck / Companion stack, with live button feedback.

It speaks WareCue's WebSocket control API (commands + `state.changed` feedback on one connection, default port `8090`).

See [`companion/HELP.md`](companion/HELP.md) for setup, actions, feedbacks, variables and presets.

## Development

```sh
npm install
npm run build        # bundles + validates the manifest, writes pkg/ and a .tgz
npm run lint         # prettier --check + tsc --noEmit
npm run dev          # rebuild on change
```

- Source is TypeScript in `src/`; `src/main.ts` is the entry.
- Built against [`@companion-module/base`](https://github.com/bitfocus/companion-module-base) 1.x.

## License

[MIT](LICENSE)
