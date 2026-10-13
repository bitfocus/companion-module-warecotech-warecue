import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type { WareCueInstance } from './main'
import {
	canTakePreview,
	cueChoices,
	outputChoices,
	previewSceneOf,
	resolveCue,
	resolveOutput,
	resolveScene,
	resolveSceneName,
	sceneChoices,
	timerChoices,
} from './choices'

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)
const GREEN = combineRgb(0, 153, 51)
const RED = combineRgb(204, 0, 0)
const AMBER = combineRgb(204, 128, 0)
const TEAL = combineRgb(0, 170, 150)

export function updateFeedbacks(self: WareCueInstance): void {
	const outputField = {
		id: 'output',
		type: 'dropdown' as const,
		label: 'Output',
		default: self.state.outputs[0]?.id ?? '',
		choices: outputChoices(self),
		allowCustom: true,
	}
	const sceneOption = {
		id: 'scene',
		type: 'dropdown' as const,
		label: 'Scene',
		default: self.state.scenes[0]?.name ?? '',
		choices: sceneChoices(self),
		allowCustom: true,
	}

	const feedbacks: CompanionFeedbackDefinitions = {
		output_scene_active: {
			type: 'boolean',
			name: 'Output: scene is on air',
			description: 'True when the given scene is the active scene on the given output.',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [outputField, sceneOption],
			callback: (fb) => {
				const output = resolveOutput(self, String(fb.options.output ?? ''))
				const wanted = resolveSceneName(self, String(fb.options.scene ?? '')) ?? String(fb.options.scene ?? '')
				return !!output && output.activeSceneName === wanted
			},
		},
		output_scene_preview: {
			type: 'boolean',
			name: 'Output: scene is in preview',
			description: 'True when the given scene is armed in the Multi-View preview for the given output.',
			defaultStyle: { bgcolor: TEAL, color: BLACK },
			options: [outputField, sceneOption],
			callback: (fb) => {
				const output = resolveOutput(self, String(fb.options.output ?? ''))
				const scene = resolveScene(self, String(fb.options.scene ?? ''))
				return !!output && !!scene && previewSceneOf(self, output)?.id === scene.id
			},
		},
		output_take_ready: {
			type: 'boolean',
			name: 'Output: TAKE ready',
			description: 'True when a preview scene is armed, differs from program, and the output is not following another.',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [outputField],
			callback: (fb) => {
				const output = resolveOutput(self, String(fb.options.output ?? ''))
				return !!output && canTakePreview(self, output)
			},
		},
		output_blackout: {
			type: 'boolean',
			name: 'Output: blackout is on',
			defaultStyle: { bgcolor: BLACK, color: WHITE },
			options: [outputField],
			callback: (fb) => resolveOutput(self, String(fb.options.output ?? ''))?.blackout === true,
		},
		output_enabled: {
			type: 'boolean',
			name: 'Output: is enabled (on air)',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [outputField],
			callback: (fb) => resolveOutput(self, String(fb.options.output ?? ''))?.enabled === true,
		},
		output_display_missing: {
			type: 'boolean',
			name: 'Output: display unplugged',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [outputField],
			callback: (fb) => resolveOutput(self, String(fb.options.output ?? ''))?.displayMissing === true,
		},
		cue_is_standby: {
			type: 'boolean',
			name: 'Cue: is armed (standby / next GO)',
			description: 'True when the given cue is the armed standby — what the next GO will fire.',
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			options: [
				{
					id: 'cue',
					type: 'dropdown',
					label: 'Cue',
					default: self.state.cues[0]?.name ?? '',
					choices: cueChoices(self),
					allowCustom: true,
				},
			],
			callback: (fb) => {
				const cue = resolveCue(self, String(fb.options.cue ?? ''))
				return !!cue && !!self.state.standbyCueId && cue.id === self.state.standbyCueId
			},
		},
		cue_is_live: {
			type: 'boolean',
			name: 'Cue: is on air (playhead)',
			description: 'True when the given cue is the last one taken (the on-air cue).',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{
					id: 'cue',
					type: 'dropdown',
					label: 'Cue',
					default: self.state.cues[0]?.name ?? '',
					choices: cueChoices(self),
					allowCustom: true,
				},
			],
			callback: (fb) => {
				const cue = resolveCue(self, String(fb.options.cue ?? ''))
				return !!cue && !!self.state.playheadCueId && cue.id === self.state.playheadCueId
			},
		},
		master_blackout: {
			type: 'boolean',
			name: 'Master: all outputs black',
			defaultStyle: { bgcolor: BLACK, color: WHITE },
			options: [],
			callback: () => self.state.master.blackout,
		},
		timer_running: {
			type: 'boolean',
			name: 'Timer: is running',
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			options: [
				{
					id: 'timer',
					type: 'dropdown',
					label: 'Timer',
					default: self.state.timers[0]?.id ?? '',
					choices: timerChoices(self),
					allowCustom: true,
				},
			],
			callback: (fb) => {
				const ref = String(fb.options.timer ?? '').trim()
				const timer = self.state.timers.find((t) => t.id === ref || String(t.index) === ref || t.name === ref)
				return timer?.running === true
			},
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
