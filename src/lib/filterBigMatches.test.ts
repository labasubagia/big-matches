import { describe, expect, it } from 'vitest'
import { filterBigMatches, type Match } from './filterBigMatches'

function match(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    utcDate: '2026-11-01T20:00:00Z',
    status: 'SCHEDULED',
    competition: { name: 'La Liga' },
    homeTeam: { id: 86, name: 'Real Madrid' },
    awayTeam: { id: 81, name: 'Barcelona' },
    ...overrides,
  }
}

describe('filterBigMatches', () => {
  it('keeps mutual pairings where both teams are selected', () => {
    const fixtures = [match()]
    const out = filterBigMatches(fixtures)
    expect(out).toHaveLength(1)
    expect(out[0]).toBe(fixtures[0])
  })

  it('drops matches where either team is not selected', () => {
    const fixtures = [
      match(), // Real Madrid vs Barcelona -> keep
      match({ id: 2, homeTeam: { id: 86, name: 'Real Madrid' }, awayTeam: { id: 63, name: 'Cádiz' } }),
      match({ id: 3, homeTeam: { id: 64, name: 'Liverpool' }, awayTeam: { id: 68, name: 'Norwich City' } }),
      match({ id: 4, homeTeam: { id: 61, name: 'Chelsea' }, awayTeam: { id: 65, name: 'Manchester City' } }),
    ]
    const out = filterBigMatches(fixtures)
    expect(out.map((m) => m.id)).toEqual([1, 4])
  })

  it('returns empty array for empty input', () => {
    expect(filterBigMatches([])).toEqual([])
  })
})
