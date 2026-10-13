## WareCue

Control [WareCue](https://warecue.com) — scene playout and multi-display show control — from Companion and Stream Deck. Commands and live button feedback travel over WareCue's WebSocket control API on one connection.

### Setup

1. In **WareCue** enable the control servers (Settings → Control / API). Note the machine's IP address and the WebSocket port (default **8090**). If you set a control **auth token**, have it to hand.
2. In Companion, add this connection and fill in:
   - **WareCue host / IP** — the machine running WareCue (e.g. `192.168.1.50`, or `127.0.0.1` if on the same PC).
   - **WebSocket port** — default `8090`.
   - **Auth token** — only if WareCue has one set; otherwise leave blank.

The connection turns green once WareCue says hello. It reconnects automatically if WareCue restarts.

> References accept an index, a name, or an id — so an **Output**, **Scene**, **Cue** or **Timer** field can be picked from the dropdown or typed (including a `$(variable)`).

### Actions

- **Output:** take scene, next / previous scene, blackout (on/off/toggle), enable / disable
- **Multi-View:** **preview (arm) scene** for an output, **TAKE** (preview → program, using the scene's enter transition), **swap** (take preview and arm what was on program) — the TAKE ↑ / Swap buttons on the app's Multi-View panel. The armed preview is held in Companion (one per output); TAKE sends it exactly as the app's TAKE button does. It is separate from the preview well in the app window.
- **Transport:** play, pause, restart (for the scene on an output)
- **Cue stack:** **GO** (take the armed standby cue and advance — the remote Enter / Space), standby → next, standby → previous, arm a specific cue, sync standby to the playhead, **re-arm** (fade the live cue to black and arm it again)
- **Cue:** fire a specific cue, pause, resume
- **Master:** take a scene on all outputs, blackout all, fallback (A/B failover), turn all outputs off
- **Audio:** test tone (A1–A4)
- **Timer:** start, pause, reset, **set duration** (absolute, e.g. 5m / 10m), adjust (± seconds), set message

> **GO vs Fire.** **GO** fires whatever cue is armed (standby) and advances the stack — the classic take workflow, where you pre-arm the next cue and press GO to run the show in order. **Cue: fire** jumps straight to a named cue. Arm the next cue with **standby → next / previous** (or **arm a specific cue**), then drive the whole show from one GO button. These mirror WareCue's own keyboard: Enter / Space = GO, ↑ / ↓ = move standby, Esc = sync standby.

### Feedbacks

- **Output: scene is on air** — light a button when its scene is the active one (the key "which scene is live" feedback)
- **Output: scene is in preview** — light a button teal when its scene is armed in that output's Multi-View preview
- **Output: TAKE ready** — lit when a preview is armed, differs from program, and the output isn't following another
- **Output: blackout on**, **enabled (on air)**, **display unplugged**
- **Cue: is armed (standby / next GO)** — light a button amber when its cue is the one GO will fire next
- **Cue: is on air (playhead)** — light a button green when its cue is the last one taken
- **Master: all outputs black**
- **Timer: is running**

### Variables

Connection status, master blackout / live-output count, and counts of outputs, scenes, cues and timers. The cue stack publishes the armed and on-air cue so you can show them on a button: `$(warecue:cue_standby_num)` / `cue_standby_name` (next GO) and `$(warecue:cue_active_num)` / `cue_active_name` (on air). Plus per-output (`$(warecue:output_1_scene)` on program, `$(warecue:output_1_preview)` in preview, `_name`, `_enabled`, `_blackout`) and per-timer (`$(warecue:timer_1_text)`, `_running`, `_message`, `_name`) values.

### Presets

Presets are **show-agnostic** — they reference cues, scenes, outputs and timers by number, so a button dropped onto a Stream Deck maps to that slot in whatever show is loaded (not the show that happened to be connected when you browsed the list):

- **Cue stack** — GO, standby ▲ / ▼, sync, re-arm.
- **Cues** — `Cue 1 … Cue 20`, each fires that cue and lights amber when armed, green when on air.
- **Take scene** — `Take scene 1 … 12`, takes that scene on all outputs.
- **Master** — blackout, fallback.
- **Output 1 … 4** — next / previous scene, blackout (with feedback).
- **Multi-View: Output 1 … 4** — `PVW SCN 1 … 12` (arm that scene in preview: teal when armed, red when on program), **TAKE** (lit red when ready), **SWAP**, and **PGM / PVW** buttons that show the program and preview scene names. A vision-mixer layout: a row of preview scenes, with TAKE and SWAP beside PGM / PVW.
- **Timer** — start (lit when running), pause, reset; adjust `+5 MIN / +1 MIN / −1 MIN / +30s / −30s`; and set-absolute `5m / 10m / 15m / 20m / 30m / 45m / 60m` — the same grid as the app's timer panel. These target **Timer 1**; for a second timer, drop the matching **Timer** action and pick the timer in its dropdown.

A minimal GO layout: one **GO** button with **STBY ▲** / **STBY ▼** either side, and a button whose text is `$(warecue:cue_standby_name)` so you always see what GO will fire next.
