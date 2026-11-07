import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	port: number
}

/** Kept out of the plain config, so it is masked in the UI and left out of exports. */
export interface ModuleSecrets {
	token?: string
}

export function getConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'About',
			value:
				'Controls WareCue over its WebSocket control API. Enable the control servers in WareCue (Settings → Control / API) and enter the machine address below. Commands and live feedback share one connection.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'WareCue host / IP',
			width: 8,
			default: '127.0.0.1',
			regex: Regex.HOSTNAME,
		},
		{
			type: 'number',
			id: 'port',
			label: 'WebSocket port',
			width: 4,
			default: 8090,
			min: 1,
			max: 65535,
		},
		{
			type: 'secret-text',
			id: 'token',
			label: 'Auth token (optional)',
			width: 12,
			default: '',
			tooltip: 'Only needed if WareCue has a control auth token set. Leave blank otherwise.',
		},
	]
}

export function defaultConfig(): ModuleConfig {
	return { host: '127.0.0.1', port: 8090 }
}
