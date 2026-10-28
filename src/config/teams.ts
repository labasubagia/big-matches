// Football-Data.org competition codes we scan for matches and teams.
// Domestic leagues are listed first so the picker shows league groups before the
// UCL. A team appears under every competition it plays in (its league *and* any
// cup). UEL is not included: Football-Data.org serves it only on a paid plan
// (HTTP 403).
export const competitionCodes = ["PL", "PD", "SA", "BL1", "FL1", "CL"];

// Default selection shown on first visit (before the user changes it).
export const DEFAULT_SELECTED_IDS = [86, 81, 64, 108, 524, 78, 61, 66, 65];
