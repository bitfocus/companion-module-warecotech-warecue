import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import type { WareCueInstance } from './main'
import { previewSceneOf } from './choices'

export function updateVariables(self: WareCueInstance): void {
	const defs: CompanionVariableDefinition[] = [
		{ variableId: 'connection', name: 'Connection status' },
		{ variableId: 'master_blackout', name: 'Master blackout (on/off)' },
		{ variableId: 'master_live_outputs', name: 'Live (non-black) output count' },
		{ variableId: 'output_count', name: 'Output count' },
		{ variableId: 'scene_count', name: 'Scene count' },
		{ variableId: 'cue_count', name: 'Cue count' },
		{ variableId: 'cue_standby_num', name: 'Standby cue number (next GO)' },
		{ variableId: 'cue_standby_name', name: 'Standby cue name (next GO)' },
		{ variableId: 'cue_active_num', name: 'On-air cue number (playhead)' },
		{ variableId: 'cue_active_name', name: 'On-air cue name (playhead)' },
		{ variableId: 'timer_count', name: 'Timer count' },
	]

	for (const o of self.state.outputs) {
		defs.push(
			{ variableId: `output_${o.index}_name`, name: `Output ${o.index} name` },
			{ variableId: `output_${o.index}_scene`, name: `Output ${o.index} active scene` },
			{ variableId: `output_${o.index}_preview`, name: `Output ${o.index} preview scene (next TAKE)` },
			{ variableId: `output_${o.index}_enabled`, name: `Output ${o.index} enabled (on/off)` },
			{ variableId: `output_${o.index}_blackout`, name: `Output ${o.index} blackout (on/off)` },
		)
	}
	for (const t of self.state.timers) {
		defs.push(
			{ variableId: `timer_${t.index}_name`, name: `Timer ${t.index} name` },
			{ variableId: `timer_${t.index}_text`, name: `Timer ${t.index} display` },
			{ variableId: `timer_${t.index}_running`, name: `Timer ${t.index} running (on/off)` },
			{ variableId: `timer_${t.index}_message`, name: `Timer ${t.index} message` },
		)
	}

	self.setVariableDefinitions(defs)
}

export function setVariableValues(self: WareCueInstance): void {
	const s = self.state
	const standbyCue = s.standbyCueId ? s.cues.find((c) => c.id === s.standbyCueId) : undefined
	const activeCue = s.playheadCueId ? s.cues.find((c) => c.id === s.playheadCueId) : undefined
	const values: CompanionVariableValues = {
		master_blackout: s.master.blackout ? 'on' : 'off',
		master_live_outputs: s.master.liveOutputs,
		output_count: s.outputs.length,
		scene_count: s.scenes.length,
		cue_count: s.cues.length,
		cue_standby_num: standbyCue?.num ?? '—',
		cue_standby_name: s.standbyCueName ?? '—',
		cue_active_num: activeCue?.num ?? '—',
		cue_active_name: s.playheadCueName ?? '—',
		timer_count: s.timers.length,
	}
	for (const o of s.outputs) {
		values[`output_${o.index}_name`] = o.name
		values[`output_${o.index}_scene`] = o.activeSceneName ?? '—'
		values[`output_${o.index}_preview`] = previewSceneOf(self, o)?.name ?? '—'
		values[`output_${o.index}_enabled`] = o.enabled ? 'on' : 'off'
		values[`output_${o.index}_blackout`] = o.blackout ? 'on' : 'off'
	}
	for (const t of s.timers) {
		values[`timer_${t.index}_name`] = t.name
		values[`timer_${t.index}_text`] = t.text
		values[`timer_${t.index}_running`] = t.running ? 'on' : 'off'
		values[`timer_${t.index}_message`] = t.message
	}
	self.setVariableValues(values)
}
