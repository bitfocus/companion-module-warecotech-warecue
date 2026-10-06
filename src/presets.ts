import { combineRgb, type CompanionPresetDefinitions } from '@companion-module/base'
import type { WareCueInstance } from './main'

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)
const DARK = combineRgb(27, 27, 27)
const GREEN = combineRgb(0, 153, 51)

export function updatePresets(self: WareCueInstance): void {
	const presets: CompanionPresetDefinitions = {}

	// --- Master ---
	presets['master_blackout'] = {
		type: 'button',
		category: 'Master',
		name: 'Master blackout (toggle)',
		style: { text: 'MASTER\\nBLACKOUT', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'master_blackout', options: { value: 'toggle' } }], up: [] }],
		feedbacks: [{ feedbackId: 'master_blackout', options: {}, style: { bgcolor: BLACK, color: WHITE } }],
	}
	presets['master_fallback'] = {
		type: 'button',
		category: 'Master',
		name: 'Fallback (A/B failover)',
		style: { text: 'FALL\\nOVER', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'master_fallback', options: {} }], up: [] }],
		feedbacks: [],
	}

	// --- Per output: next / prev / blackout ---
	for (const o of self.state.outputs) {
		presets[`out_${o.index}_next`] = {
			type: 'button',
			category: `Output ${o.index}`,
			name: `Output ${o.index}: next scene`,
			style: { text: `OUT ${o.index}\\nNEXT ▶`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'output_next', options: { output: o.id } }], up: [] }],
			feedbacks: [],
		}
		presets[`out_${o.index}_prev`] = {
			type: 'button',
			category: `Output ${o.index}`,
			name: `Output ${o.index}: previous scene`,
			style: { text: `OUT ${o.index}\\n◀ PREV`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'output_prev', options: { output: o.id } }], up: [] }],
			feedbacks: [],
		}
		presets[`out_${o.index}_blackout`] = {
			type: 'button',
			category: `Output ${o.index}`,
			name: `Output ${o.index}: blackout`,
			style: { text: `OUT ${o.index}\\nBLACK`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'output_blackout', options: { output: o.id, value: 'toggle' } }], up: [] }],
			feedbacks: [
				{ feedbackId: 'output_blackout', options: { output: o.id }, style: { bgcolor: BLACK, color: WHITE } },
			],
		}
	}

	// --- Cues ---
	for (const c of self.state.cues) {
		presets[`cue_${c.id}`] = {
			type: 'button',
			category: 'Cues',
			name: `Fire cue ${c.num} ${c.name}`.trim(),
			style: {
				text: `${c.num ? c.num + '\\n' : ''}${c.name}`,
				size: '14',
				color: WHITE,
				bgcolor: DARK,
			},
			steps: [{ down: [{ actionId: 'cue_fire', options: { cue: c.name } }], up: [] }],
			feedbacks: [],
		}
	}

	// --- Timers ---
	for (const t of self.state.timers) {
		presets[`timer_${t.index}_start`] = {
			type: 'button',
			category: 'Timers',
			name: `Start ${t.name}`,
			style: { text: `${t.name}\\nSTART`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'timer_start', options: { timer: t.id } }], up: [] }],
			feedbacks: [{ feedbackId: 'timer_running', options: { timer: t.id }, style: { bgcolor: GREEN, color: WHITE } }],
		}
		presets[`timer_${t.index}_pause`] = {
			type: 'button',
			category: 'Timers',
			name: `Pause ${t.name}`,
			style: { text: `${t.name}\\nPAUSE`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'timer_pause', options: { timer: t.id } }], up: [] }],
			feedbacks: [],
		}
	}

	self.setPresetDefinitions(presets)
}
