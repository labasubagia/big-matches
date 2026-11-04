import { useEffect, useState } from "react";
import { type Fixtures, loadFixtures } from "./loadFixtures";

export type FixturesState =
	| { status: "loading"; fixtures: null; error: null }
	| { status: "ready"; fixtures: Fixtures; error: null }
	| { status: "error"; fixtures: null; error: Error };

// Loads the static fixtures after first paint. Keeps the multi-megabyte match
// dataset off the critical path of the initial render (see loadFixtures.ts).
// Loads fixtures with bounded auto-retry. A single transient fetch failure
// (network blip, service-worker activation race) must not permanently surface a
// route-level error: `loadFixtures` clears its module memo on rejection, so a
// retry performs a fresh fetch. Capped so a persistent outage still errors.
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

export function useFixtures(): FixturesState {
	const [state, setState] = useState<FixturesState>({
		status: "loading",
		fixtures: null,
		error: null,
	});

	useEffect(() => {
		let alive = true;
		let retries = 0;
		let timer: ReturnType<typeof setTimeout> | undefined;

		const attempt = () => {
			loadFixtures().then(
				(fixtures) => {
					if (alive) setState({ status: "ready", fixtures, error: null });
				},
				(error: unknown) => {
					if (!alive) return;
					if (retries < MAX_RETRIES) {
						retries++;
						setState({ status: "loading", fixtures: null, error: null });
						timer = setTimeout(attempt, RETRY_DELAY_MS);
					} else {
						setState({
							status: "error",
							fixtures: null,
							error: error instanceof Error ? error : new Error(String(error)),
						});
					}
				},
			);
		};
		attempt();

		return () => {
			alive = false;
			if (timer) clearTimeout(timer);
		};
	}, []);

	return state;
}
