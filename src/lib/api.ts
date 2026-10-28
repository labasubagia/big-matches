import { createServerFn } from '@tanstack/react-start'
import { competitionCodes } from '../config/teams'
import { filterBigMatches, type Match } from './filterBigMatches'

const API_URL = process.env.FOOTBALL_DATA_API_BASE ?? 'https://api.football-data.org/v4'
const KEY = process.env.FOOTBALL_DATA_API_KEY

async function fetchCompetitionMatches(code: string): Promise<Match[]> {
  if (!KEY) {
    throw new Error('FOOTBALL_DATA_API_KEY not set')
  }
  const res = await fetch(`${API_URL}/competitions/${code}/matches`, {
    headers: { 'X-Auth-Token': KEY },
  })
  if (!res.ok) {
    throw new Error(`Football-Data API ${res.status} for competition ${code}`)
  }
  const data = (await res.json()) as { matches?: Match[] }
  return data.matches ?? []
}

// Server-side fetch across all target competitions, then filter to big matches.
export const loadBigMatches = createServerFn({ method: 'GET' })
  .validator((d: unknown) => d as { selectedIds: number[] })
  .handler(async ({ data }) => {
    const selectedIds = new Set(data.selectedIds)
    const results = await Promise.allSettled(competitionCodes.map(fetchCompetitionMatches))
    const matches = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    const seen = new Set<number>()
    for (const m of matches) {
      seen.add(m.homeTeam.id)
      seen.add(m.awayTeam.id)
    }
    const missing = [...selectedIds].filter((id) => !seen.has(id))
    if (missing.length > 0) {
      console.warn(
        `[big-matches] selected teams never appeared in fetched fixtures (check team ids): ${missing.join(', ')}`,
      )
    }
    return filterBigMatches(matches, selectedIds)
  })
