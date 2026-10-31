import { useCallback, useEffect, useMemo, useState } from "react";
import type { Team } from "./filterBigMatches";
import { readSavedSelection, toggleId, writeSelection } from "./selections";

// Shared selection state across the overview/teams pages. Reads the saved
// selection once on mount and persists every toggle to localStorage.
export function useSelection(teams: Team[]) {
	const validIds = useMemo(() => new Set(teams.map((t) => t.id)), [teams]);
	const [selected, setSelected] = useState<number[]>([]);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setSelected(readSavedSelection(validIds));
		setReady(true);
	}, [validIds]);

	const toggle = useCallback((id: number) => {
		setSelected((prev) => {
			const next = toggleId(prev, id);
			writeSelection(next);
			return next;
		});
	}, []);

	const reset = useCallback(() => {
		setSelected([]);
		writeSelection([]);
	}, []);

	return { selected, ready, toggle, reset };
}
