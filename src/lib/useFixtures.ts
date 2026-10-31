import { useEffect, useState } from "react";
import { type Fixtures, loadFixtures } from "./loadFixtures";

export type FixturesState =
	| { status: "loading"; fixtures: null; error: null }
	| { status: "ready"; fixtures: Fixtures; error: null }
	| { status: "error"; fixtures: null; error: Error };

// Loads the static fixtures after first paint. Keeps the multi-megabyte match
// dataset off the critical path of the initial render (see loadFixtures.ts).
export function useFixtures(): FixturesState {
	const [state, setState] = useState<FixturesState>({
		status: "loading",
		fixtures: null,
		error: null,
	});

	useEffect(() => {
		let alive = true;
		loadFixtures().then(
			(fixtures) => {
				if (alive) setState({ status: "ready", fixtures, error: null });
			},
			(error: unknown) => {
				if (alive)
					setState({
						status: "error",
						fixtures: null,
						error: error instanceof Error ? error : new Error(String(error)),
					});
			},
		);
		return () => {
			alive = false;
		};
	}, []);

	return state;
}
