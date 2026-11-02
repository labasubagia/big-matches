import { createServer } from "node:http";

// Minimal stand-in for api.football-data.org/v4. Serves only /competitions/:code/matches
// so the app's server-side loader runs without the real API or a real key.
const PL = { name: "Premier League", code: "PL" };
const PD = { name: "La Liga", code: "PD" };
const SA = { name: "Serie A", code: "SA" };
const BL1 = { name: "Bundesliga", code: "BL1" };
const FL1 = { name: "Ligue 1", code: "FL1" };

const FIXTURES = {
	PL: [
		{
			id: 101,
			utcDate: "2026-11-21T17:30:00Z",
			status: "TIMED",
			competition: PL,
			homeTeam: {
				id: 61,
				name: "Chelsea",
				crest: "https://crests.football-data.org/61.png",
			},
			awayTeam: {
				id: 57,
				name: "Arsenal",
				crest: "https://crests.football-data.org/57.png",
			},
		},
		{
			id: 102,
			utcDate: "2026-11-22T14:00:00Z",
			status: "TIMED",
			competition: PL,
			homeTeam: {
				id: 66,
				name: "Manchester United",
				crest: "https://crests.football-data.org/66.png",
			},
			awayTeam: {
				id: 65,
				name: "Manchester City",
				crest: "https://crests.football-data.org/65.png",
			},
		},
		{
			id: 103,
			utcDate: "2026-11-23T16:00:00Z",
			status: "TIMED",
			competition: PL,
			homeTeam: {
				id: 64,
				name: "Liverpool",
				crest: "https://crests.football-data.org/64.png",
			},
			awayTeam: {
				id: 55,
				name: "Brentford",
				crest: "https://crests.football-data.org/55.png",
			},
		},
		{
			id: 110,
			utcDate: "2026-09-20T15:00:00Z",
			status: "FINISHED",
			competition: PL,
			homeTeam: {
				id: 66,
				name: "Manchester United",
				crest: "https://crests.football-data.org/66.png",
			},
			awayTeam: {
				id: 65,
				name: "Manchester City",
				crest: "https://crests.football-data.org/65.png",
			},
			score: {
				winner: "HOME_TEAM",
				fullTime: { home: 1, away: 0 },
			},
		},
		{
			id: 111,
			utcDate: "2027-03-20T17:30:00Z",
			status: "TIMED",
			competition: PL,
			homeTeam: {
				id: 64,
				name: "Liverpool",
				crest: "https://crests.football-data.org/64.png",
			},
			awayTeam: {
				id: 61,
				name: "Chelsea",
				crest: "https://crests.football-data.org/61.png",
			},
		},
	],
	PD: [
		{
			id: 201,
			utcDate: "2026-11-28T20:00:00Z",
			status: "TIMED",
			competition: PD,
			homeTeam: {
				id: 86,
				name: "Real Madrid",
				crest: "https://crests.football-data.org/86.png",
			},
			awayTeam: {
				id: 81,
				name: "Barcelona",
				crest: "https://crests.football-data.org/81.png",
			},
		},
		{
			id: 202,
			utcDate: "2026-11-29T18:15:00Z",
			status: "TIMED",
			competition: PD,
			homeTeam: {
				id: 78,
				name: "Atlético Madrid",
				crest: "https://crests.football-data.org/78.png",
			},
			awayTeam: {
				id: 559,
				name: "Sevilla",
				crest: "https://crests.football-data.org/559.png",
			},
		},
		{
			id: 203,
			utcDate: "2027-05-01T00:00:00Z",
			status: "SCHEDULED",
			competition: PD,
			homeTeam: {
				id: 86,
				name: "Real Madrid",
				crest: "https://crests.football-data.org/86.png",
			},
			awayTeam: {
				id: 81,
				name: "Barcelona",
				crest: "https://crests.football-data.org/81.png",
			},
		},
	],
	SA: [
		{
			id: 301,
			utcDate: "2026-12-04T19:45:00Z",
			status: "TIMED",
			competition: SA,
			homeTeam: {
				id: 108,
				name: "Inter",
				crest: "https://crests.football-data.org/108.png",
			},
			awayTeam: {
				id: 109,
				name: "Juventus",
				crest: "https://crests.football-data.org/109.png",
			},
		},
	],
	BL1: [
		{
			id: 401,
			utcDate: "2026-12-05T15:30:00Z",
			status: "TIMED",
			competition: BL1,
			homeTeam: {
				id: 5,
				name: "Bayern München",
				crest: "https://crests.football-data.org/5.png",
			},
			awayTeam: {
				id: 4,
				name: "Borussia Dortmund",
				crest: "https://crests.football-data.org/4.png",
			},
		},
	],
	FL1: [
		{
			id: 501,
			utcDate: "2026-12-06T20:45:00Z",
			status: "TIMED",
			competition: FL1,
			homeTeam: {
				id: 524,
				name: "PSG",
				crest: "https://crests.football-data.org/524.png",
			},
			awayTeam: {
				id: 516,
				name: "Marseille",
				crest: "https://crests.football-data.org/516.png",
			},
		},
	],
	CL: [],
};
const COMPETITION_NAMES = {
	PL: "Premier League",
	PD: "La Liga",
	SA: "Serie A",
	BL1: "Bundesliga",
	FL1: "Ligue 1",
	CL: "UEFA Champions League",
};

const TEAMS = Object.fromEntries(
	Object.entries(FIXTURES).map(([code, fixtures]) => {
		const seen = new Map();
		for (const m of fixtures) {
			for (const side of [m.homeTeam, m.awayTeam]) {
				if (!seen.has(side.id)) seen.set(side.id, { ...side });
			}
		}
		return [
			code,
			{
				competition: { name: COMPETITION_NAMES[code] },
				teams: [...seen.values()],
			},
		];
	}),
);

const port = Number(process.env.MOCK_API_PORT ?? 3333);

const server = createServer((req, res) => {
	const url = new URL(req.url ?? "/", "http://127.0.0.1");
	if (url.pathname === "/health") {
		res.writeHead(200);
		res.end("ok");
		return;
	}
	const teamsM = /^\/competitions\/([^/]+)\/teams$/.exec(url.pathname);
	if (teamsM) {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify(TEAMS[teamsM[1]] ?? { competition: {}, teams: [] }));
		return;
	}
	const m = /^\/competitions\/([^/]+)\/matches$/.exec(url.pathname);
	if (!m) {
		res.writeHead(404);
		res.end();
		return;
	}
	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(JSON.stringify({ matches: FIXTURES[m[1]] ?? [] }));
});

server.listen(port, "127.0.0.1");
