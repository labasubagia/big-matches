export type Team = {
	id: number;
	name: string;
	competition: string;
};

// Football-Data.org team ids (verified against the live API).
// Grouped by competition for the picker UI.
export const teamCatalog: Team[] = [
	// Premier League
	{ id: 57, name: "Arsenal", competition: "Premier League" },
	{ id: 58, name: "Aston Villa", competition: "Premier League" },
	{ id: 61, name: "Chelsea", competition: "Premier League" },
	{ id: 64, name: "Liverpool", competition: "Premier League" },
	{ id: 65, name: "Manchester City", competition: "Premier League" },
	{ id: 66, name: "Manchester United", competition: "Premier League" },
	{ id: 67, name: "Newcastle", competition: "Premier League" },
	{ id: 73, name: "Tottenham", competition: "Premier League" },
	// La Liga
	{ id: 77, name: "Athletic Club", competition: "La Liga" },
	{ id: 78, name: "Atlético Madrid", competition: "La Liga" },
	{ id: 81, name: "Barcelona", competition: "La Liga" },
	{ id: 86, name: "Real Madrid", competition: "La Liga" },
	{ id: 90, name: "Real Betis", competition: "La Liga" },
	{ id: 92, name: "Real Sociedad", competition: "La Liga" },
	{ id: 94, name: "Villarreal", competition: "La Liga" },
	{ id: 95, name: "Valencia", competition: "La Liga" },
	{ id: 559, name: "Sevilla", competition: "La Liga" },
	// Serie A
	{ id: 98, name: "AC Milan", competition: "Serie A" },
	{ id: 99, name: "Fiorentina", competition: "Serie A" },
	{ id: 100, name: "AS Roma", competition: "Serie A" },
	{ id: 102, name: "Atalanta", competition: "Serie A" },
	{ id: 108, name: "Inter", competition: "Serie A" },
	{ id: 109, name: "Juventus", competition: "Serie A" },
	{ id: 110, name: "Lazio", competition: "Serie A" },
	{ id: 113, name: "Napoli", competition: "Serie A" },
	// Bundesliga
	{ id: 3, name: "Leverkusen", competition: "Bundesliga" },
	{ id: 4, name: "Borussia Dortmund", competition: "Bundesliga" },
	{ id: 5, name: "Bayern München", competition: "Bundesliga" },
	{ id: 10, name: "VfB Stuttgart", competition: "Bundesliga" },
	{ id: 12, name: "Werder Bremen", competition: "Bundesliga" },
	{ id: 18, name: "Gladbach", competition: "Bundesliga" },
	{ id: 19, name: "Eintracht Frankfurt", competition: "Bundesliga" },
	{ id: 721, name: "RB Leipzig", competition: "Bundesliga" },
	// Ligue 1
	{ id: 516, name: "Marseille", competition: "Ligue 1" },
	{ id: 521, name: "Lille", competition: "Ligue 1" },
	{ id: 522, name: "Nice", competition: "Ligue 1" },
	{ id: 523, name: "Lyon", competition: "Ligue 1" },
	{ id: 524, name: "PSG", competition: "Ligue 1" },
	{ id: 529, name: "Rennes", competition: "Ligue 1" },
	{ id: 546, name: "Lens", competition: "Ligue 1" },
	{ id: 548, name: "AS Monaco", competition: "Ligue 1" },
];

// Default selection shown on first visit (before the user changes it).
export const DEFAULT_SELECTED_IDS = [86, 81, 64, 108, 524, 78, 61, 66, 65];

// Competition codes we care about: UCL, EPL, La Liga, Serie A, Bundesliga, Ligue 1.
// UEL is not included: Football-Data.org serves it only on a paid plan (HTTP 403 on free tier).
export const competitionCodes = ["CL", "PL", "PD", "SA", "BL1", "FL1"];
