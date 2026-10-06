import type { DropdownChoice } from '@companion-module/base'
import type { WareCueInstance } from './main'
import type { FeedbackOutput } from './state'

const NONE: DropdownChoice = { id: '', label: '(connect to WareCue)' }

export function outputChoices(self: WareCueInstance): DropdownChoice[] {
	const list = self.state.outputs.map((o) => ({ id: o.id, label: `${o.index}: ${o.name}` }))
	return list.length ? list : [NONE]
}

export function sceneChoices(self: WareCueInstance): DropdownChoice[] {
	const list = self.state.scenes.map((s) => ({ id: s.name, label: `${s.index}: ${s.name}` }))
	return list.length ? list : [NONE]
}

export function cueChoices(self: WareCueInstance): DropdownChoice[] {
	const list = self.state.cues.map((c) => ({
		id: c.name,
		label: c.num ? `${c.num} — ${c.name}` : c.name,
	}))
	return list.length ? list : [NONE]
}

export function timerChoices(self: WareCueInstance): DropdownChoice[] {
	const list = self.state.timers.map((t) => ({ id: t.id, label: `${t.index}: ${t.name}` }))
	return list.length ? list : [NONE]
}

export const BUS_CHOICES: DropdownChoice[] = [
	{ id: 'A1', label: 'A1' },
	{ id: 'A2', label: 'A2' },
	{ id: 'A3', label: 'A3' },
	{ id: 'A4', label: 'A4' },
]

export const TOGGLE_CHOICES: DropdownChoice[] = [
	{ id: 'on', label: 'On' },
	{ id: 'off', label: 'Off' },
	{ id: 'toggle', label: 'Toggle' },
]

/** Resolve an output by id, 1-based index, or name — the three refs WareCue accepts. */
export function resolveOutput(self: WareCueInstance, ref: string): FeedbackOutput | undefined {
	const needle = ref.trim()
	if (!needle) return undefined
	return self.state.outputs.find((o) => o.id === needle || String(o.index) === needle || o.name === needle)
}

/** Resolve a scene ref (name, 1-based index, or id) to its current name. */
export function resolveSceneName(self: WareCueInstance, ref: string): string | undefined {
	const needle = ref.trim()
	if (!needle) return undefined
	const scene = self.state.scenes.find((s) => s.name === needle || String(s.index) === needle || s.id === needle)
	return scene?.name
}
