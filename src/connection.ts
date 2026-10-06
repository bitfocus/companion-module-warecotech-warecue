import WebSocket from 'ws'
import { isFeedbackState, type FeedbackState } from './state'

export type ConnStatus = 'connecting' | 'ok' | 'disconnected' | 'unauthorized'

export interface ConnectionHandlers {
	onState: (state: FeedbackState) => void
	onStatus: (status: ConnStatus, message?: string) => void
	log: (level: 'debug' | 'info' | 'warn' | 'error', message: string) => void
}

interface Pending {
	resolve: (result: { ok: boolean; error?: string }) => void
	timer: ReturnType<typeof setTimeout>
}

const RECONNECT_MS = 3000
const COMMAND_TIMEOUT_MS = 5000

/**
 * Holds one WebSocket open to WareCue. Commands and feedback travel over it:
 * `{ id, command, args }` out, `{ type: 'result', id, ok }` back, and
 * `state.changed` frames push the live picture. Reconnects on its own.
 */
export class WareCueConnection {
	#url: string
	#token: string
	#handlers: ConnectionHandlers
	#ws: WebSocket | null = null
	#reconnect: ReturnType<typeof setTimeout> | null = null
	#closed = false
	#nextId = 1
	#pending = new Map<number, Pending>()

	constructor(host: string, port: number, token: string, handlers: ConnectionHandlers) {
		this.#url = `ws://${host}:${port}`
		this.#token = token
		this.#handlers = handlers
	}

	connect(): void {
		this.#closed = false
		this.#open()
	}

	#open(): void {
		this.#handlers.onStatus('connecting')
		const headers = this.#token ? { Authorization: `Bearer ${this.#token}` } : undefined
		const url = this.#token ? `${this.#url}?token=${encodeURIComponent(this.#token)}` : this.#url

		let ws: WebSocket
		try {
			ws = new WebSocket(url, { headers })
		} catch (err) {
			this.#handlers.log('error', `WebSocket construction failed: ${String(err)}`)
			this.#scheduleReconnect()
			return
		}
		this.#ws = ws

		ws.on('open', () => {
			this.#handlers.log('debug', `connected to ${this.#url}`)
			// A snapshot arrives automatically on connect; ask again as a belt-and-braces.
			this.#raw({ command: 'state.get' })
		})

		ws.on('message', (raw) => this.#onMessage(raw.toString()))

		ws.on('close', (code) => {
			if (code === 4401) {
				this.#handlers.onStatus('unauthorized', 'WareCue rejected the auth token')
				this.#handlers.log('error', 'unauthorized — check the auth token')
				// Don't hammer a locked door; still retry slowly in case the token is fixed.
			} else {
				this.#handlers.onStatus('disconnected')
			}
			this.#failAllPending('connection closed')
			this.#scheduleReconnect()
		})

		ws.on('error', (err) => {
			this.#handlers.log('debug', `socket error: ${err.message}`)
			// 'close' follows and handles reconnect.
		})
	}

	#onMessage(text: string): void {
		let msg: Record<string, unknown>
		try {
			msg = JSON.parse(text) as Record<string, unknown>
		} catch {
			return
		}

		if (msg.type === 'hello') {
			this.#handlers.onStatus('ok')
			this.#handlers.log('info', `WareCue says hello (${String(msg.app ?? 'WareCue')})`)
			return
		}

		if (isFeedbackState(msg)) {
			this.#handlers.onStatus('ok')
			this.#handlers.onState(msg)
			return
		}

		if (msg.type === 'result') {
			const id = typeof msg.id === 'number' ? msg.id : null
			if (id !== null) {
				const pending = this.#pending.get(id)
				if (pending) {
					clearTimeout(pending.timer)
					this.#pending.delete(id)
					pending.resolve({ ok: msg.ok === true, error: (msg.error as string) ?? undefined })
				}
			}
			if (msg.ok === false) this.#handlers.log('warn', `command refused: ${String(msg.error)}`)
			return
		}
	}

	/** Send a command and resolve when WareCue acknowledges it. */
	send(command: string, args: Record<string, unknown> = {}): Promise<{ ok: boolean; error?: string }> {
		const ws = this.#ws
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			return Promise.resolve({ ok: false, error: 'not connected' })
		}
		const id = this.#nextId++
		return new Promise((resolve) => {
			const timer = setTimeout(() => {
				this.#pending.delete(id)
				resolve({ ok: false, error: 'timed out' })
			}, COMMAND_TIMEOUT_MS)
			this.#pending.set(id, { resolve, timer })
			this.#raw({ id, command, args })
		})
	}

	#raw(payload: Record<string, unknown>): void {
		try {
			this.#ws?.send(JSON.stringify(payload))
		} catch (err) {
			this.#handlers.log('debug', `send failed: ${String(err)}`)
		}
	}

	#failAllPending(error: string): void {
		for (const { resolve, timer } of this.#pending.values()) {
			clearTimeout(timer)
			resolve({ ok: false, error })
		}
		this.#pending.clear()
	}

	#scheduleReconnect(): void {
		if (this.#closed || this.#reconnect) return
		this.#reconnect = setTimeout(() => {
			this.#reconnect = null
			if (!this.#closed) this.#open()
		}, RECONNECT_MS)
	}

	destroy(): void {
		this.#closed = true
		if (this.#reconnect) {
			clearTimeout(this.#reconnect)
			this.#reconnect = null
		}
		this.#failAllPending('module shutting down')
		try {
			this.#ws?.removeAllListeners()
			this.#ws?.close()
		} catch {
			// ignore
		}
		this.#ws = null
	}
}
