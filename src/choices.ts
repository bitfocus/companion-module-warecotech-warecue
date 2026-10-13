import type { DropdownChoice } from '@companion-module/base'
import type { WareCueInstance } from './main'
import type { FeedbackCue, FeedbackOutput, FeedbackScene } from './state'

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

/**
 * Resolve a scene ref to the scene, in the same priority order as WareCue's
 * own `resolveRef` (id, then name case-insensitively, then 1-based position),
 * so a button lights the same scene it takes.
 */
export function resolveScene(self: WareCueInstance, ref: string): FeedbackScene | undefined {
	const needle = ref.trim()
	if (!needle) return undefined
	const scenes = self.state.scenes
	const lower = needle.toLowerCase()
	return (
		scenes.find((s) => s.id === needle) ??
		scenes.find((s) => s.name.toLowerCase() === lower) ??
		(/^\d+$/.test(needle) ? scenes.find((s) => s.index === Number(needle)) : undefined)
	)
}

/** Resolve a scene ref (id, name, or 1-based index) to its current name. */
export function resolveSceneName(self: WareCueInstance, ref: string): string | undefined {
	return resolveScene(self, ref)?.name
}

/** The scene armed in Companion's Multi-View preview for this output, if any. */
export function previewSceneOf(self: WareCueInstance, output: FeedbackOutput): FeedbackScene | undefined {
	const id = self.previewByOutput.get(output.id)
	return id ? self.state.scenes.find((s) => s.id === id) : undefined
}

/**
 * Preview can go to program when one is armed, it differs from program, and
 * the output is not following another — the app's own `canTakePreview` rule.
 */
export function canTakePreview(self: WareCueInstance, output: FeedbackOutput): boolean {
	const preview = previewSceneOf(self, output)
	return !!preview && !output.parentOutputId && preview.id !== output.activeSceneId
}

/**
 * Resolve a cue ref to the cue, in the same priority order as WareCue's own
 * `resolveCueRef` (cue number, then id, then name case-insensitively, then
 * 1-based position) — so a button lights the same cue it fires.
 */
export function resolveCue(self: WareCueInstance, ref: string): FeedbackCue | undefined {
	const needle = ref.trim()
	if (!needle) return undefined
	const cues = self.state.cues
	const lower = needle.toLowerCase()
	return (
		cues.find((c) => c.num === needle) ??
		cues.find((c) => c.id === needle) ??
		cues.find((c) => c.name.toLowerCase() === lower) ??
		(/^\d+$/.test(needle) ? cues.find((c) => c.index === Number(needle)) : undefined)
	)
}

/** 0-based position of a cue in the stack — what `cue.setStandby` expects. */
export function resolveCueIndex(self: WareCueInstance, ref: string): number | null {
	const cue = resolveCue(self, ref)
	if (!cue) return null
	return self.state.cues.indexOf(cue)
}
