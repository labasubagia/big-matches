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

// In-memory cache so page refreshes don't re-hit the API (free tier: 10 req/min).
const TTL_MS = 5 * 60 * 1000
let cache: { at: number; matches: Match[] } | null = null

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, ms)
  return promise
}

// Fetches every match across the target competitions. Runs on the server;
// the client filters these against its locally-saved selection.
export const loadAllMatches = createServerFn({ method: 'GET' }).handler(async () => {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) {
    return cache.matches
  }
  const all: Match[] = []
  for (const code of competitionCodes) {
    try {
      all.push(...(await fetchCompetitionMatches(code)))
    } catch {
      // skip competitions that fail (e.g. rate limit); the rest still render
    }
    await delay(150)
  }
  cache = { at: now, matches: all }
  return all
})
