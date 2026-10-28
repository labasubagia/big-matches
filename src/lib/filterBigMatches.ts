import { selectedTeamIds } from '../config/teams'

export type Match = {
  id: number
  utcDate: string
  status: string
  competition: { name: string }
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
}

// Keep only fixtures where BOTH teams are in the selected list.
// Mutual pairings only; matches against non-selected teams are dropped.
export function filterBigMatches(matches: Match[]): Match[] {
  return matches.filter(
    (m) => selectedTeamIds.has(m.homeTeam.id) && selectedTeamIds.has(m.awayTeam.id),
  )
}
