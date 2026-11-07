import {
	combineRgb,
	type CompanionFeedbackBooleanEvent,
	type CompanionFeedbackContext,
	type CompanionFeedbackDefinitions,
} from '@companion-module/base'
import type { WareCueInstance } from './main.js'
import {
	canTakePreview,
	cueChoices,
	outputChoices,
	previewSceneOf,
	resolveCue,
	resolveOutput,
	resolveScene,
	sceneChoices,
	timerChoices,
	cueRefOf,
} from './choices.js'

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)
const GREEN = combineRgb(0, 153, 51)
const RED = combineRgb(204, 0, 0)
const AMBER = combineRgb(204, 128, 0)
const TEAL = combineRgb(0, 170, 150)

// Read an option, expanding any $(…) variables through the feedback's own
// context — which also makes Companion re-check it when those variables change.
const opt = async (
	context: CompanionFeedbackContext,
	fb: CompanionFeedbackBooleanEvent,
	key: string,
): Promise<string> => (await context.parseVariablesInString(String(fb.options[key] ?? ''))).trim()

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
		default: self.state.scenes[0]?.id ?? '',
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
			callback: async (fb, context) => {
				const output = resolveOutput(self, await opt(context, fb, 'output'))
				const scene = resolveScene(self, await opt(context, fb, 'scene'))
				return !!output && !!scene && output.activeSceneId === scene.id
			},
		},
		output_scene_preview: {
			type: 'boolean',
			name: 'Output: scene is in preview',
			description: 'True when the given scene is armed in the Multi-View preview for the given output.',
			defaultStyle: { bgcolor: TEAL, color: BLACK },
			options: [outputField, sceneOption],
			callback: async (fb, context) => {
				const output = resolveOutput(self, await opt(context, fb, 'output'))
				const scene = resolveScene(self, await opt(context, fb, 'scene'))
				return !!output && !!scene && previewSceneOf(self, output)?.id === scene.id
			},
		},
		output_take_ready: {
			type: 'boolean',
			name: 'Output: TAKE ready',
			description: 'True when a preview scene is armed, differs from program, and the output is not following another.',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [outputField],
			callback: async (fb, context) => {
				const output = resolveOutput(self, await opt(context, fb, 'output'))
				return !!output && canTakePreview(self, output)
			},
		},
		output_blackout: {
			type: 'boolean',
			name: 'Output: blackout is on',
			defaultStyle: { bgcolor: BLACK, color: WHITE },
			options: [outputField],
			callback: async (fb, context) => resolveOutput(self, await opt(context, fb, 'output'))?.blackout === true,
		},
		output_enabled: {
			type: 'boolean',
			name: 'Output: is enabled (on air)',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [outputField],
			callback: async (fb, context) => resolveOutput(self, await opt(context, fb, 'output'))?.enabled === true,
		},
		output_display_missing: {
			type: 'boolean',
			name: 'Output: display unplugged',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [outputField],
			callback: async (fb, context) => resolveOutput(self, await opt(context, fb, 'output'))?.displayMissing === true,
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
					default: self.state.cues[0] ? cueRefOf(self.state.cues[0]) : '',
					choices: cueChoices(self),
					allowCustom: true,
				},
			],
			callback: async (fb, context) => {
				const cue = resolveCue(self, await opt(context, fb, 'cue'))
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
					default: self.state.cues[0] ? cueRefOf(self.state.cues[0]) : '',
					choices: cueChoices(self),
					allowCustom: true,
				},
			],
			callback: async (fb, context) => {
				const cue = resolveCue(self, await opt(context, fb, 'cue'))
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
			callback: async (fb, context) => {
				const ref = (await opt(context, fb, 'timer')).trim()
				const timer = self.state.timers.find((t) => t.id === ref || String(t.index) === ref || t.name === ref)
				return timer?.running === true
			},
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
