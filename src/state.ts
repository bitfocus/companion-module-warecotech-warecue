// The read-only state WareCue pushes to every control client, mirrored from the
// app's `FeedbackState` (src/shared/feedback.ts). This is what the WebSocket
// snapshot and every `state.changed` frame contain — enough to light a Stream
// Deck button without the app ever sending scene thumbnails or layer trees.

export interface FeedbackScene {
	id: string
	/** 1-based, matching the index a sceneRef accepts. */
	index: number
	name: string
}

export interface FeedbackOutput {
	id: string
	index: number
	name: string
	enabled: boolean
	blackout: boolean
	activeSceneId: string | null
	activeSceneName: string | null
	sceneIds: string[]
	displayMissing: boolean
	parentOutputId: string | null
}

export interface FeedbackCue {
	id: string
	index: number
	num: string
	name: string
}

export interface FeedbackTimer {
	id: string
	index: number
	name: string
	running: boolean
	text: string
	remainingMs: number | null
	message: string
}

export interface FeedbackState {
	type: 'state.changed'
	outputs: FeedbackOutput[]
	scenes: FeedbackScene[]
	cues: FeedbackCue[]
	timers: FeedbackTimer[]
	master: { blackout: boolean; liveOutputs: number }
}

export function emptyState(): FeedbackState {
	return {
		type: 'state.changed',
		outputs: [],
		scenes: [],
		cues: [],
		timers: [],
		master: { blackout: false, liveOutputs: 0 },
	}
}

export function isFeedbackState(value: unknown): value is FeedbackState {
	return (
		typeof value === 'object' &&
		value !== null &&
		(value as { type?: unknown }).type === 'state.changed' &&
		Array.isArray((value as { outputs?: unknown }).outputs)
	)
}
