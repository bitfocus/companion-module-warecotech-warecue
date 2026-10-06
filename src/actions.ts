import type { CompanionActionDefinitions, CompanionActionEvent } from '@companion-module/base'
import type { WareCueInstance } from './main'
import { BUS_CHOICES, TOGGLE_CHOICES, cueChoices, outputChoices, sceneChoices, timerChoices } from './choices'

export function updateActions(self: WareCueInstance): void {
	// Parse a dropdown/custom value, expanding any $(…) variables it contains.
	const str = async (ev: CompanionActionEvent, key: string): Promise<string> =>
		(await self.parseVariablesInString(String(ev.options[key] ?? ''))).trim()

	const outputField = {
		id: 'output',
		type: 'dropdown' as const,
		label: 'Output',
		default: self.state.outputs[0]?.id ?? '',
		choices: outputChoices(self),
		allowCustom: true,
		tooltip: 'Pick an output, or type an index, name or $(variable).',
	}
	const sceneField = {
		id: 'scene',
		type: 'dropdown' as const,
		label: 'Scene',
		default: self.state.scenes[0]?.name ?? '',
		choices: sceneChoices(self),
		allowCustom: true,
	}
	const toggleField = {
		id: 'value',
		type: 'dropdown' as const,
		label: 'State',
		default: 'toggle',
		choices: TOGGLE_CHOICES,
	}
	const timerField = {
		id: 'timer',
		type: 'dropdown' as const,
		label: 'Timer',
		default: self.state.timers[0]?.id ?? '',
		choices: timerChoices(self),
		allowCustom: true,
	}

	const actions: CompanionActionDefinitions = {
		output_scene: {
			name: 'Output: take scene',
			options: [outputField, sceneField],
			callback: async (ev) =>
				void self.send('output.scene', { outputId: await str(ev, 'output'), sceneRef: await str(ev, 'scene') }),
		},
		output_next: {
			name: 'Output: next scene',
			options: [outputField],
			callback: async (ev) => void self.send('output.next', { outputId: await str(ev, 'output') }),
		},
		output_prev: {
			name: 'Output: previous scene',
			options: [outputField],
			callback: async (ev) => void self.send('output.prev', { outputId: await str(ev, 'output') }),
		},
		output_blackout: {
			name: 'Output: blackout',
			options: [outputField, toggleField],
			callback: async (ev) =>
				void self.send('output.blackout', { outputId: await str(ev, 'output'), value: ev.options.value }),
		},
		output_enable: {
			name: 'Output: enable / disable',
			options: [outputField, toggleField],
			callback: async (ev) =>
				void self.send('output.enable', { outputId: await str(ev, 'output'), value: ev.options.value }),
		},
		transport_play: {
			name: 'Transport: play',
			options: [outputField],
			callback: async (ev) => void self.send('transport.play', { outputId: await str(ev, 'output') }),
		},
		transport_pause: {
			name: 'Transport: pause',
			options: [outputField],
			callback: async (ev) => void self.send('transport.pause', { outputId: await str(ev, 'output') }),
		},
		transport_restart: {
			name: 'Transport: restart',
			options: [outputField],
			callback: async (ev) => void self.send('transport.restart', { outputId: await str(ev, 'output') }),
		},
		cue_fire: {
			name: 'Cue: fire',
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
			callback: async (ev) => void self.send('cue.fire', { cueRef: await str(ev, 'cue') }),
		},
		cue_pause: {
			name: 'Cue: pause',
			options: [],
			callback: async () => void self.send('cue.pause'),
		},
		cue_resume: {
			name: 'Cue: resume',
			options: [],
			callback: async () => void self.send('cue.resume'),
		},
		master_scene: {
			name: 'Master: take scene on all outputs',
			options: [sceneField],
			callback: async (ev) => void self.send('master.scene', { sceneRef: await str(ev, 'scene') }),
		},
		master_blackout: {
			name: 'Master: blackout all',
			options: [toggleField],
			callback: async (ev) => void self.send('master.blackout', { value: ev.options.value }),
		},
		master_fallback: {
			name: 'Master: fallback (A/B failover)',
			options: [],
			callback: async () => void self.send('master.fallback'),
		},
		master_outputs_off: {
			name: 'Master: turn all outputs off',
			options: [],
			callback: async () => void self.send('master.outputsOff'),
		},
		audio_test_tone: {
			name: 'Audio: test tone',
			options: [{ id: 'bus', type: 'dropdown', label: 'Bus', default: 'A1', choices: BUS_CHOICES }],
			callback: async (ev) => void self.send('audio.testTone', { busId: ev.options.bus }),
		},
		timer_start: {
			name: 'Timer: start',
			options: [timerField],
			callback: async (ev) => void self.send('timer.start', { timerRef: await str(ev, 'timer') }),
		},
		timer_pause: {
			name: 'Timer: pause',
			options: [timerField],
			callback: async (ev) => void self.send('timer.pause', { timerRef: await str(ev, 'timer') }),
		},
		timer_reset: {
			name: 'Timer: reset',
			options: [timerField],
			callback: async (ev) => void self.send('timer.reset', { timerRef: await str(ev, 'timer') }),
		},
		timer_adjust: {
			name: 'Timer: adjust (± seconds)',
			options: [
				timerField,
				{ id: 'seconds', type: 'number', label: 'Seconds (negative subtracts)', default: 30, min: -86400, max: 86400 },
			],
			callback: async (ev) =>
				void self.send('timer.adjust', { timerRef: await str(ev, 'timer'), seconds: Number(ev.options.seconds) }),
		},
		timer_message: {
			name: 'Timer: set message',
			options: [timerField, { id: 'message', type: 'textinput', label: 'Message', default: '', useVariables: true }],
			callback: async (ev) =>
				void self.send('timer.message', { timerRef: await str(ev, 'timer'), message: await str(ev, 'message') }),
		},
	}

	self.setActionDefinitions(actions)
}
