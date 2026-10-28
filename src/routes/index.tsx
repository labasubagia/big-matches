import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DEFAULT_SELECTED_IDS, teamCatalog } from '../config/teams'
import { loadAllMatches } from '../lib/api'
import { filterBigMatches, type Match } from '../lib/filterBigMatches'

export const Route = createFileRoute('/')({
  component: Home,
  loader: () => loadAllMatches(),
})

const STORAGE_KEY = 'big-matches-selected'

function readSavedSelection(): number[] {
  if (typeof window === 'undefined') return DEFAULT_SELECTED_IDS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SELECTED_IDS
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      const valid = new Set(teamCatalog.map((t) => t.id))
      const ids = parsed.filter((n): n is number => typeof n === 'number' && valid.has(n))
      if (ids.length > 0) return ids
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_SELECTED_IDS
}

function writeSelection(ids: number[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // storage unavailable; ignore
  }
}

function fmtDate(utc: string): string {
  return new Date(utc).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtStatus(m: Match): string {
  switch (m.status) {
    case 'FINISHED':
      return 'FT'
    case 'LIVE':
    case 'IN_PLAY':
      return 'Live'
    case 'PAUSED':
      return 'HT'
    case 'SCHEDULED':
      return ''
    default:
      return m.status
  }
}

const competitions = [...new Set(teamCatalog.map((t) => t.competition))]

function Home() {
  const allMatches = Route.useLoaderData()
  const [selected, setSelected] = useState<number[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setSelected(readSavedSelection())
    setReady(true)
  }, [])

  // Warn if a selected team never appears in any fetched match (bad id).
  useEffect(() => {
    if (!ready) return
    const seen = new Set<number>()
    for (const m of allMatches) {
      seen.add(m.homeTeam.id)
      seen.add(m.awayTeam.id)
    }
    const missing = selected.filter((id) => !seen.has(id))
    if (missing.length > 0) {
      console.warn(
        `[big-matches] selected teams never appeared in fetched fixtures (check team ids): ${missing.join(', ')}`,
      )
    }
  }, [ready, selected, allMatches])

  const matches = useMemo(
    () => (ready ? filterBigMatches(allMatches, new Set(selected)) : []),
    [ready, allMatches, selected],
  )

  function toggle(id: number) {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      writeSelection(next)
      return next
    })
  }

  const byCompetition = new Map<string, Match[]>()
  for (const m of matches) {
    const list = byCompetition.get(m.competition.name) ?? []
    list.push(m)
    byCompetition.set(m.competition.name, list)
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 760, margin: '0 auto', padding: '1rem' }}>
      <h1>Big Matches</h1>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem' }}>Select teams</h2>
        <form
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: '0.75rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {competitions.map((competition) => (
            <fieldset key={competition} style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ fontWeight: 600, padding: 0 }}>{competition}</legend>
              {teamCatalog
                .filter((t) => t.competition === competition)
                .map((t) => (
                  <label key={t.id} style={{ display: 'block', padding: '0.1rem 0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(t.id)}
                      onChange={() => toggle(t.id)}
                    />{' '}
                    {t.name}
                  </label>
                ))}
            </fieldset>
          ))}
        </form>
      </section>

      {ready && matches.length === 0 ? (
        <p>No mutual-pairing fixtures for the selected teams right now.</p>
      ) : (
        [...byCompetition.entries()].map(([name, list]) => (
          <section key={name} style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem' }}>{name}</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {list.map((m) => (
                <li
                  key={m.id}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #eee' }}
                >
                  <span>
                    {m.homeTeam.name} vs {m.awayTeam.name}
                  </span>
                  <span style={{ color: '#666' }}>
                    {fmtDate(m.utcDate)} {fmtStatus(m)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  )
}
