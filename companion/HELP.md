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
- **Transport:** play, pause, restart (for the scene on an output)
- **Cue:** fire, pause, resume
- **Master:** take a scene on all outputs, blackout all, fallback (A/B failover), turn all outputs off
- **Audio:** test tone (A1–A4)
- **Timer:** start, pause, reset, adjust (± seconds), set message

### Feedbacks

- **Output: scene is on air** — light a button when its scene is the active one (the key "which scene is live" feedback)
- **Output: blackout on**, **enabled (on air)**, **display unplugged**
- **Master: all outputs black**
- **Timer: is running**

### Variables

Connection status, master blackout / live-output count, and counts of outputs, scenes, cues and timers; plus per-output (`$(warecue:output_1_scene)`, `_name`, `_enabled`, `_blackout`) and per-timer (`$(warecue:timer_1_text)`, `_running`, `_message`, `_name`) values.

### Presets

Ready-made buttons for master blackout/fallback, per-output next/prev/blackout (with feedback), one per cue, and per-timer start/pause.
