export type Team = {
  id: number
  name: string
}

// Football-Data.org team ids (stable across seasons).
export const selectedTeams: Team[] = [
  { id: 86, name: 'Real Madrid' },
  { id: 81, name: 'Barcelona' },
  { id: 64, name: 'Liverpool' },
  { id: 108, name: 'Inter Milan' },
  { id: 524, name: 'PSG' },
  { id: 78, name: 'Atlético Madrid' },
  { id: 61, name: 'Chelsea' },
  { id: 66, name: 'Manchester United' },
  { id: 65, name: 'Manchester City' },
]

export const selectedTeamIds = new Set(selectedTeams.map((t) => t.id))
export const selectedTeamById = new Map(selectedTeams.map((t) => [t.id, t.name]))

// Competition codes we care about: UCL, UEL, EPL, La Liga, Serie A, Bundesliga, Ligue 1.
export const competitionCodes = ['CL', 'EL', 'PL', 'PD', 'SA', 'BL1', 'FL1']
