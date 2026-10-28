import type { MatchFilterState } from "../lib/useMatchFilters";

export function MatchFilters(f: MatchFilterState) {
	return (
		<section style={{ position: "relative", marginBottom: "1.5rem" }}>
			<button
				type="button"
				onClick={() => f.setOpen((o) => !o)}
				aria-expanded={f.open}
				style={{ cursor: "pointer" }}
			>
				Filters
				{f.selectedTeams.length > 0 ? ` (${f.selectedTeams.length})` : ""}
			</button>

			{f.open && (
				<div
					style={{
						marginTop: "0.4rem",
						padding: "0.75rem",
						border: "1px solid #ccc",
						borderRadius: 8,
						background: "#fff",
						boxShadow: "0 2px 8px rgba(0,0,0,.15)",
					}}
				>
					<div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
						<label style={{ fontSize: "0.9rem" }}>
							From{" "}
							<input
								type="date"
								value={f.fromStr}
								onChange={(e) => f.setFromStr(e.target.value)}
							/>
						</label>
						<label style={{ fontSize: "0.9rem" }}>
							To{" "}
							<input
								type="date"
								value={f.toStr}
								onChange={(e) => f.setToStr(e.target.value)}
							/>
						</label>
					</div>

					<input
						type="search"
						placeholder="Search teams…"
						value={f.query}
						onChange={(e) => f.setQuery(e.target.value)}
						style={{ marginTop: "0.6rem", width: "100%" }}
					/>
					<ul
						style={{
							listStyle: "none",
							padding: 0,
							margin: "0.4rem 0",
							maxHeight: 200,
							overflowY: "auto",
							border: "1px solid #eee",
							borderRadius: 6,
						}}
					>
						{f.candidates.map((t) => {
							const checked = f.selectedTeams.includes(t.id);
							return (
								<li key={t.id}>
									<label
										style={{
											display: "flex",
											gap: "0.4rem",
											padding: "0.2rem 0.5rem",
										}}
									>
										<input
											type="checkbox"
											checked={checked}
											onChange={() => f.toggleTeam(t.id)}
										/>
										{t.name}
									</label>
								</li>
							);
						})}
					</ul>

					<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
						<button
							type="button"
							onClick={f.reset}
							style={{ cursor: "pointer" }}
						>
							Reset
						</button>
						<span style={{ fontSize: "0.85rem", color: "#666" }}>
							{f.selectedTeams.length === 0
								? "All selected big teams"
								: f.selectedTeams.length === 1
									? "1 club selected"
									: `${f.selectedTeams.length} clubs selected`}
						</span>
					</div>
				</div>
			)}
		</section>
	);
}
