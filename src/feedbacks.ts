import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type { WareCueInstance } from './main'
import { outputChoices, resolveOutput, resolveSceneName, sceneChoices, timerChoices } from './choices'

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)
const GREEN = combineRgb(0, 153, 51)
const RED = combineRgb(204, 0, 0)
const AMBER = combineRgb(204, 128, 0)

export function updateFeedbacks(self: WareCueInstance): void {
	const outputField = {
		id: 'output',
		type: 'dropdown' as const,
		label: 'Output',
		default: self.state.outputs[0]?.id ?? '',
		choices: outputChoices(self),
		allowCustom: true,
	}

	const feedbacks: CompanionFeedbackDefinitions = {
		output_scene_active: {
			type: 'boolean',
			name: 'Output: scene is on air',
			description: 'True when the given scene is the active scene on the given output.',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				outputField,
				{
					id: 'scene',
					type: 'dropdown',
					label: 'Scene',
					default: self.state.scenes[0]?.name ?? '',
					choices: sceneChoices(self),
					allowCustom: true,
				},
			],
			callback: (fb) => {
				const output = resolveOutput(self, String(fb.options.output ?? ''))
				const wanted = resolveSceneName(self, String(fb.options.scene ?? '')) ?? String(fb.options.scene ?? '')
				return !!output && output.activeSceneName === wanted
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
