import {
	combineRgb,
	type CompanionButtonPresetDefinition,
	type CompanionPresetDefinitions,
} from '@companion-module/base'
import type { WareCueInstance } from './main'

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)
const DARK = combineRgb(27, 27, 27)
const GREEN = combineRgb(0, 153, 51)
const GO_GREEN = combineRgb(0, 102, 34)
const AMBER = combineRgb(204, 128, 0)

// Fixed, show-agnostic presets. They reference cues / scenes / outputs / timers
// by number, so a button dropped onto a Stream Deck maps to that slot in
// whatever show is loaded — never baked to the show that happened to be
// connected when the preset list was built.
const CUE_COUNT = 20
const SCENE_COUNT = 12
const OUTPUT_COUNT = 4 // WareCue's MAX_VIDEO_OUTPUTS
const TIMER_REF = '1' // the preset timer; multi-timer rigs use the Timer field on the action

export function updatePresets(self: WareCueInstance): void {
	const presets: CompanionPresetDefinitions = {}
	const add = (id: string, preset: CompanionButtonPresetDefinition): void => {
		presets[id] = preset
	}

	// --- Cue stack: GO + standby navigation ---
	add('cue_go', {
		type: 'button',
		category: 'Cue stack',
		name: 'GO (take standby cue)',
		style: { text: 'GO', size: '30', color: WHITE, bgcolor: GO_GREEN },
		steps: [{ down: [{ actionId: 'cue_go', options: {} }], up: [] }],
		feedbacks: [],
	})
	add('cue_standby_prev', {
		type: 'button',
		category: 'Cue stack',
		name: 'Standby ▲ (arm previous)',
		style: { text: 'STBY\\n▲', size: '18', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'cue_standby_prev', options: {} }], up: [] }],
		feedbacks: [],
	})
	add('cue_standby_next', {
		type: 'button',
		category: 'Cue stack',
		name: 'Standby ▼ (arm next)',
		style: { text: 'STBY\\n▼', size: '18', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'cue_standby_next', options: {} }], up: [] }],
		feedbacks: [],
	})
	add('cue_sync_standby', {
		type: 'button',
		category: 'Cue stack',
		name: 'Sync standby to playhead',
		style: { text: 'SYNC\\nSTBY', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'cue_sync_standby', options: {} }], up: [] }],
		feedbacks: [],
	})

	// --- Cues 1..N: fire by number, lit amber when armed / green when live ---
	for (let n = 1; n <= CUE_COUNT; n += 1) {
		const ref = String(n)
		add(`cue_${n}`, {
			type: 'button',
			category: 'Cues',
			name: `Cue ${n} (fire)`,
			style: { text: `CUE\\n${n}`, size: '18', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'cue_fire', options: { cue: ref } }], up: [] }],
			feedbacks: [
				{ feedbackId: 'cue_is_live', options: { cue: ref }, style: { bgcolor: GREEN, color: WHITE } },
				{ feedbackId: 'cue_is_standby', options: { cue: ref }, style: { bgcolor: AMBER, color: BLACK } },
			],
		})
	}

	// --- Take scene 1..N on all outputs ---
	for (let n = 1; n <= SCENE_COUNT; n += 1) {
		add(`take_scene_${n}`, {
			type: 'button',
			category: 'Take scene',
			name: `Take scene ${n} (all outputs)`,
			style: { text: `TAKE\\nSCN ${n}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'master_scene', options: { scene: String(n) } }], up: [] }],
			feedbacks: [],
		})
	}

	// --- Master ---
	add('master_blackout', {
		type: 'button',
		category: 'Master',
		name: 'Master blackout (toggle)',
		style: { text: 'MASTER\\nBLACKOUT', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'master_blackout', options: { value: 'toggle' } }], up: [] }],
		feedbacks: [{ feedbackId: 'master_blackout', options: {}, style: { bgcolor: BLACK, color: WHITE } }],
	})
	add('master_fallback', {
		type: 'button',
		category: 'Master',
		name: 'Fallback (A/B failover)',
		style: { text: 'FALL\\nOVER', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'master_fallback', options: {} }], up: [] }],
		feedbacks: [],
	})

	// --- Per output 1..4: next / prev / blackout ---
	for (let n = 1; n <= OUTPUT_COUNT; n += 1) {
		const ref = String(n)
		add(`out_${n}_next`, {
			type: 'button',
			category: `Output ${n}`,
			name: `Output ${n}: next scene`,
			style: { text: `OUT ${n}\\nNEXT ▶`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'output_next', options: { output: ref } }], up: [] }],
			feedbacks: [],
		})
		add(`out_${n}_prev`, {
			type: 'button',
			category: `Output ${n}`,
			name: `Output ${n}: previous scene`,
			style: { text: `OUT ${n}\\n◀ PREV`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'output_prev', options: { output: ref } }], up: [] }],
			feedbacks: [],
		})
		add(`out_${n}_blackout`, {
			type: 'button',
			category: `Output ${n}`,
			name: `Output ${n}: blackout`,
			style: { text: `OUT ${n}\\nBLACK`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'output_blackout', options: { output: ref, value: 'toggle' } }], up: [] }],
			feedbacks: [{ feedbackId: 'output_blackout', options: { output: ref }, style: { bgcolor: BLACK, color: WHITE } }],
		})
	}

	// --- Timer: transport, adjust, and absolute set (the app's panel) ---
	add('timer_start', {
		type: 'button',
		category: 'Timer',
		name: 'Timer: start',
		style: { text: 'TIMER\\nSTART', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'timer_start', options: { timer: TIMER_REF } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'timer_running', options: { timer: TIMER_REF }, style: { bgcolor: GREEN, color: WHITE } },
		],
	})
	add('timer_pause', {
		type: 'button',
		category: 'Timer',
		name: 'Timer: pause',
		style: { text: 'TIMER\\nPAUSE', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'timer_pause', options: { timer: TIMER_REF } }], up: [] }],
		feedbacks: [],
	})
	add('timer_reset', {
		type: 'button',
		category: 'Timer',
		name: 'Timer: reset',
		style: { text: 'TIMER\\nRESET', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'timer_reset', options: { timer: TIMER_REF } }], up: [] }],
		feedbacks: [],
	})

	const adjustPresets: { secs: number; label: string }[] = [
		{ secs: 300, label: '+5 MIN' },
		{ secs: 60, label: '+1 MIN' },
		{ secs: -60, label: '-1 MIN' },
		{ secs: 30, label: '+30s' },
		{ secs: -30, label: '-30s' },
	]
	for (const { secs, label } of adjustPresets) {
		add(`timer_adj_${secs}`, {
			type: 'button',
			category: 'Timer',
			name: `Timer: ${label}`,
			style: { text: label.replace(' ', '\\n'), size: '18', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'timer_adjust', options: { timer: TIMER_REF, seconds: secs } }], up: [] }],
			feedbacks: [],
		})
	}

	for (const mins of [5, 10, 15, 20, 30, 45, 60]) {
		add(`timer_set_${mins}`, {
			type: 'button',
			category: 'Timer',
			name: `Timer: set ${mins}m`,
			style: { text: `SET\\n${mins}m`, size: '18', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'timer_set', options: { timer: TIMER_REF, minutes: mins, seconds: 0 } }], up: [] }],
			feedbacks: [],
		})
	}

	self.setPresetDefinitions(presets)
}
