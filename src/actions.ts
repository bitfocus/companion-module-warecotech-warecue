import type { CompanionActionDefinitions, CompanionActionEvent } from '@companion-module/base'
import type { WareCueInstance } from './main'
import {
	BUS_CHOICES,
	TOGGLE_CHOICES,
	cueChoices,
	outputChoices,
	resolveCueIndex,
	sceneChoices,
	timerChoices,
} from './choices'

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
		cue_go: {
			name: 'Cue: GO (take standby)',
			description: 'Fire the armed standby cue and advance to the next one — the operator Enter / Space.',
			options: [],
			callback: async () => void self.send('cue.go'),
		},
		cue_standby_next: {
			name: 'Cue: standby → next',
			description: 'Arm the next cue in the stack (does not fire).',
			options: [],
			callback: async () => void self.send('cue.moveStandby', { delta: 1 }),
		},
		cue_standby_prev: {
			name: 'Cue: standby → previous',
			description: 'Arm the previous cue in the stack (does not fire).',
			options: [],
			callback: async () => void self.send('cue.moveStandby', { delta: -1 }),
		},
		cue_set_standby: {
			name: 'Cue: arm (set standby)',
			description: 'Arm a specific cue so the next GO fires it.',
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
			callback: async (ev) => {
				const index = resolveCueIndex(self, await str(ev, 'cue'))
				if (index !== null) void self.send('cue.setStandby', { index })
			},
		},
		cue_sync_standby: {
			name: 'Cue: sync standby to playhead',
			description: 'Snap standby back to the next enabled cue after the on-air cue.',
			options: [],
			callback: async () => void self.send('cue.syncStandby'),
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
		timer_set: {
			name: 'Timer: set duration',
			description: 'Set a timer to an absolute duration (the app’s 5m / 10m / 60m buttons).',
			options: [
				timerField,
				{ id: 'minutes', type: 'number', label: 'Minutes', default: 5, min: 0, max: 1440 },
				{ id: 'seconds', type: 'number', label: 'Seconds', default: 0, min: 0, max: 59 },
			],
			callback: async (ev) =>
				void self.send('timer.set', {
					timerRef: await str(ev, 'timer'),
					minutes: Number(ev.options.minutes),
					seconds: Number(ev.options.seconds),
				}),
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
