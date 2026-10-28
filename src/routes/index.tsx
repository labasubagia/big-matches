import { createFileRoute } from '@tanstack/react-router'
import { selectedTeams } from '../config/teams'
import { loadBigMatches } from '../lib/api'
import type { Match } from '../lib/filterBigMatches'

export const Route = createFileRoute('/')({
  component: Home,
  loader: () => loadBigMatches(),
})

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

function Home() {
  const matches = Route.useLoaderData()
  const byCompetition = new Map<string, Match[]>()
  for (const m of matches) {
    const list = byCompetition.get(m.competition.name) ?? []
    list.push(m)
    byCompetition.set(m.competition.name, list)
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto', padding: '1rem' }}>
      <h1>Big Matches</h1>
      <p style={{ color: '#666' }}>
        Only fixtures between selected teams:{' '}
        {selectedTeams.map((t) => t.name).join(', ')}.
      </p>

      {matches.length === 0 ? (
        <p>No mutual-pairing fixtures right now. Need a Football-Data.org API key in <code>FOOTBALL_DATA_API_KEY</code>.</p>
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
