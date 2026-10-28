import { createServerFn } from '@tanstack/react-start'
import { competitionCodes } from '../config/teams'
import type { Match } from './filterBigMatches'

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

// Fetches every match across the target competitions. Runs on the server;
// the client filters these against its locally-saved selection.
export const loadAllMatches = createServerFn({ method: 'GET' }).handler(async () => {
  const results = await Promise.allSettled(competitionCodes.map(fetchCompetitionMatches))
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
})
