import { InstanceBase, InstanceStatus, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import { defaultConfig, getConfigFields, type ModuleConfig, type ModuleSecrets } from './config.js'
import { WareCueConnection, type ConnStatus } from './connection.js'
import { emptyState, type FeedbackState } from './state.js'
import { UpgradeScripts } from './upgrades.js'
import { updateActions } from './actions.js'
import { updateFeedbacks } from './feedbacks.js'
import { setVariableValues, updateVariables } from './variables.js'
import { updatePresets } from './presets.js'

export class WareCueInstance extends InstanceBase<ModuleConfig, ModuleSecrets> {
	config: ModuleConfig = defaultConfig()
	secrets: ModuleSecrets = {}
	state: FeedbackState = emptyState()
	connection: WareCueConnection | null = null
	/**
	 * Multi-View preview scene armed per output id, held in Companion. WareCue's
	 * own preview well is window-only, so these buttons keep their own armed
	 * scene and TAKE sends it with `output.scene` — exactly what the app's
	 * TAKE button sends.
	 */
	previewByOutput = new Map<string, string>()
	#membershipKey = ''
	#lastStatus = ''

	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets ?? {}
		this.#onStatus('connecting')
		this.#connect()
	}

	async destroy(): Promise<void> {
		this.connection?.destroy()
		this.connection = null
	}

	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets ?? {}
		this.#connect()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields()
	}

	/** Send a command; a failure (offline, timed out, refused) is logged so a dead button press leaves a trace. */
	async send(command: string, args?: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
		const result = this.connection ? await this.connection.send(command, args) : { ok: false, error: 'not connected' }
		if (!result.ok) this.log('warn', `${command} failed: ${result.error ?? 'refused'}`)
		return result
	}

	/** Arm (or clear) an output's preview scene and refresh what shows it. */
	setPreview(outputId: string, sceneId: string | null): void {
		if (sceneId) this.previewByOutput.set(outputId, sceneId)
		else this.previewByOutput.delete(outputId)
		setVariableValues(this)
		this.checkFeedbacks('output_scene_preview', 'output_take_ready')
	}

	#connect(): void {
		this.connection?.destroy()
		this.connection = null
		this.state = emptyState()
		this.previewByOutput.clear()
		this.#membershipKey = ''
		// Clear the previous WareCue's show from buttons, variables and dropdowns now,
		// rather than when the first state message arrives from the new host.
		this.#rebuildDefinitions()
		this.checkFeedbacks()

		const host = (this.config.host ?? '').trim()
		if (!host) {
			this.#onStatus('badconfig', 'Host is not set')
			return
		}
		this.connection = new WareCueConnection(host, this.config.port ?? 8090, this.secrets.token ?? '', {
			onState: (s) => this.#onState(s),
			onStatus: (st, msg) => this.#onStatus(st, msg),
			log: (level, message) => this.log(level, message),
		})
		this.connection.connect()
	}

	/** Forward a status (and the `connection` variable) only when it changes: state frames arrive every tick. */
	#onStatus(status: ConnStatus, message?: string): void {
		const key = `${status}|${message ?? ''}`
		if (key === this.#lastStatus) return
		this.#lastStatus = key
		switch (status) {
			case 'ok':
				this.updateStatus(InstanceStatus.Ok)
				break
			case 'connecting':
				this.updateStatus(InstanceStatus.Connecting)
				break
			case 'unauthorized':
			case 'badconfig':
				this.updateStatus(InstanceStatus.BadConfig, message)
				break
			default:
				this.updateStatus(InstanceStatus.Disconnected, message)
		}
		this.setVariableValues({ connection: status })
	}

	#onState(state: FeedbackState): void {
		this.state = state
		// Drop armed previews whose scene or output is gone, as the app does.
		const sceneIds = new Set(state.scenes.map((s) => s.id))
		const outputIds = new Set(state.outputs.map((o) => o.id))
		for (const [outputId, sceneId] of this.previewByOutput) {
			if (!outputIds.has(outputId) || !sceneIds.has(sceneId)) this.previewByOutput.delete(outputId)
		}
		const key = this.#membershipKeyOf(state)
		if (key !== this.#membershipKey) {
			this.#membershipKey = key
			this.#rebuildDefinitions()
		}
		setVariableValues(this)
		this.checkFeedbacks()
	}

	#rebuildDefinitions(): void {
		updateActions(this)
		updateFeedbacks(this)
		updateVariables(this)
		updatePresets(this)
		setVariableValues(this)
	}

	/** A fingerprint of the things that drive dropdown choices / variable lists. */
	#membershipKeyOf(s: FeedbackState): string {
		return [
			s.outputs.map((o) => `${o.id}:${o.name}`).join(','),
			s.scenes.map((x) => `${x.id}:${x.name}`).join(','),
			s.cues.map((c) => `${c.id}:${c.num}:${c.name}`).join(','),
			s.timers.map((t) => `${t.id}:${t.name}`).join(','),
		].join('|')
	}
}

runEntrypoint(WareCueInstance, UpgradeScripts)
