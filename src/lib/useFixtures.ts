import { useCallback, useEffect, useState } from "react";
import { type Fixtures, loadFixturesOrThrow } from "./loadFixtures";

export type FixturesState =
	| { status: "loading"; fixtures: null; error: null }
	| { status: "ready"; fixtures: Fixtures; error: null }
	| { status: "error"; fixtures: null; error: Error };

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

// Bounded auto-retry around an async load. A single transient failure (network
// blip, service-worker activation race) must not permanently surface a
// route-level error: `loadFixtures` clears its module memo on rejection, so
// each retry performs a fresh fetch. Capped so a persistent outage still errors.
// Returns a cancel() that stops pending retry timers (used on unmount).
export function retryAsyncLoad(
	load: () => Promise<Fixtures>,
	onReady: (fixtures: Fixtures) => void,
	onError: (error: Error) => void,
	maxRetries = MAX_RETRIES,
	delayMs = RETRY_DELAY_MS,
): () => void {
	let cancelled = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let retries = 0;

	const attempt = () => {
		Promise.resolve()
			.then(load)
			.then(
				(fixtures) => {
					if (!cancelled) onReady(fixtures);
				},
				(error: unknown) => {
					if (cancelled) return;
					if (retries < maxRetries) {
						retries++;
						timer = setTimeout(attempt, delayMs);
					} else {
						onError(error instanceof Error ? error : new Error(String(error)));
					}
				},
			);
	};
	attempt();

	return () => {
		cancelled = true;
		clearTimeout(timer);
	};
}

// Loads the static fixtures after first paint. Keeps the multi-megabyte match
// dataset off the critical path of the initial render (see loadFixtures.ts).
export function useFixtures(): FixturesState & { reload: () => void } {
	const [state, setState] = useState<FixturesState>({
		status: "loading",
		fixtures: null,
		error: null,
	});
	// Bump to re-run the load (user-triggered retry after a load error).
	const [nonce, setNonce] = useState(0);

	// `nonce` re-creates the loader so the effect re-runs on user retry.
	const runLoad = useCallback(
		(_nonce: number) =>
			retryAsyncLoad(
				loadFixturesOrThrow,
				(fixtures) => setState({ status: "ready", fixtures, error: null }),
				(error) => setState({ status: "error", fixtures: null, error }),
			),
		[],
	);

	useEffect(() => runLoad(nonce), [nonce, runLoad]);

	const reload = useCallback(() => {
		// Flip back to loading so Retry gives immediate feedback instead of
		// keeping the stale error panel visible until the new load settles.
		setState({ status: "loading", fixtures: null, error: null });
		setNonce((n) => n + 1);
	}, []);
	return { ...state, reload };
}
