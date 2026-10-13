import { InstanceBase, InstanceStatus, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import { defaultConfig, getConfigFields, type ModuleConfig } from './config'
import { WareCueConnection, type ConnStatus } from './connection'
import { emptyState, type FeedbackState } from './state'
import { UpgradeScripts } from './upgrades'
import { updateActions } from './actions'
import { updateFeedbacks } from './feedbacks'
import { setVariableValues, updateVariables } from './variables'
import { updatePresets } from './presets'

export class WareCueInstance extends InstanceBase<ModuleConfig> {
	config: ModuleConfig = defaultConfig()
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

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Connecting)
		this.#rebuildDefinitions()
		this.#connect()
	}

	async destroy(): Promise<void> {
		this.connection?.destroy()
		this.connection = null
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.#connect()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields()
	}

	send(command: string, args?: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
		if (!this.connection) return Promise.resolve({ ok: false, error: 'not connected' })
		return this.connection.send(command, args)
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
		this.state = emptyState()
		this.previewByOutput.clear()
		this.#membershipKey = ''
		this.connection = new WareCueConnection(this.config.host, this.config.port ?? 8090, this.config.token ?? '', {
			onState: (s) => this.#onState(s),
			onStatus: (st, msg) => this.#onStatus(st, msg),
			log: (level, message) => this.log(level, message),
		})
		this.connection.connect()
	}

	#onStatus(status: ConnStatus, message?: string): void {
		switch (status) {
			case 'ok':
				this.updateStatus(InstanceStatus.Ok)
				break
			case 'connecting':
				this.updateStatus(InstanceStatus.Connecting)
				break
			case 'unauthorized':
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
