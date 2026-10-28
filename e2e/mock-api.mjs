import { createServer } from "node:http";

// Minimal stand-in for api.football-data.org/v4. Serves only /competitions/:code/matches
// so the app's server-side loader runs without the real API or a real key.
const FIXTURES = {
	PL: [
		{
			id: 101,
			utcDate: "2026-11-21T17:30:00Z",
			status: "SCHEDULED",
			competition: { name: "Premier League" },
			homeTeam: { id: 61, name: "Chelsea" },
			awayTeam: { id: 57, name: "Arsenal" },
		},
		{
			id: 102,
			utcDate: "2026-11-22T14:00:00Z",
			status: "SCHEDULED",
			competition: { name: "Premier League" },
			homeTeam: { id: 66, name: "Manchester United" },
			awayTeam: { id: 65, name: "Manchester City" },
		},
		{
			id: 103,
			utcDate: "2026-11-23T16:00:00Z",
			status: "SCHEDULED",
			competition: { name: "Premier League" },
			homeTeam: { id: 64, name: "Liverpool" },
			awayTeam: { id: 55, name: "Brentford" },
		},
	],
	PD: [
		{
			id: 201,
			utcDate: "2026-11-28T20:00:00Z",
			status: "SCHEDULED",
			competition: { name: "La Liga" },
			homeTeam: { id: 86, name: "Real Madrid" },
			awayTeam: { id: 81, name: "Barcelona" },
		},
		{
			id: 202,
			utcDate: "2026-11-29T18:15:00Z",
			status: "SCHEDULED",
			competition: { name: "La Liga" },
			homeTeam: { id: 78, name: "Atlético Madrid" },
			awayTeam: { id: 559, name: "Sevilla" },
		},
	],
	SA: [
		{
			id: 301,
			utcDate: "2026-12-04T19:45:00Z",
			status: "SCHEDULED",
			competition: { name: "Serie A" },
			homeTeam: { id: 108, name: "Inter" },
			awayTeam: { id: 109, name: "Juventus" },
		},
	],
	BL1: [
		{
			id: 401,
			utcDate: "2026-12-05T15:30:00Z",
			status: "SCHEDULED",
			competition: { name: "Bundesliga" },
			homeTeam: { id: 5, name: "Bayern München" },
			awayTeam: { id: 4, name: "Borussia Dortmund" },
		},
	],
	FL1: [
		{
			id: 501,
			utcDate: "2026-12-06T20:45:00Z",
			status: "SCHEDULED",
			competition: { name: "Ligue 1" },
			homeTeam: { id: 524, name: "PSG" },
			awayTeam: { id: 516, name: "Marseille" },
		},
	],
	CL: [],
};

const port = Number(process.env.MOCK_API_PORT ?? 3333);

const server = createServer((req, res) => {
	const url = new URL(req.url ?? "/", "http://127.0.0.1");
	if (url.pathname === "/health") {
		res.writeHead(200);
		res.end("ok");
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
