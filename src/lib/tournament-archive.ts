export type PoolStandingRow = {
  rank: number;
  team: string;
  points: number;
  wins: number;
  losses: number;
  draws?: number;
  scoreDiff: number;
  h2hWins?: number;
  h2hDiff?: number;
};

export type PlayoffMatch = {
  round: "semi" | "final" | "third";
  label: string;
  teamA: string;
  teamB: string;
  seedA?: string;
  seedB?: string;
  /** [teamA score, teamB score] per set */
  sets: [number, number][];
  winner: string;
};

export type PoolMatchResult = {
  pool: string;
  time: string;
  court: string;
  teamA: string;
  teamB: string;
  /** [teamA score, teamB score] per set */
  sets: [number, number][];
  /** Null when the match finished as a draw. */
  winner: string | null;
  referee?: string;
};

export type PlayoffBracket = {
  key: string;
  name: string;
  blurb?: string;
  podium: { place: 1 | 2 | 3; team: string }[];
  matches: PlayoffMatch[];
};

export type TournamentArchiveEntry = {
  slug: string;
  title: string;
  dateLabel: string;
  location: string;
  coverImage?: string;
  status: "completed" | "upcoming";
  /** Shown in the detail hero (optional overrides). */
  heroTitle?: string;
  heroHighlight?: string;
  /** Primary podium for the overview card (usually the Cup / overall champions). */
  podium: { place: 1 | 2 | 3; team: string }[];
  pools: { name: string; rows: PoolStandingRow[] }[];
  /** Single-bracket tournaments. Ignored when `brackets` is set. */
  playoffs: PlayoffMatch[];
  /** Multi-bracket tournaments (e.g. Rose Cup + Rose Shield). */
  brackets?: PlayoffBracket[];
  /** Shown under each pool table. */
  poolAdvanceNote?: string;
  /** How pool ranks are highlighted in standings. */
  poolHighlight?: "top-two" | "cup-and-shield";
  /** Optional pool-stage match results (set scores). */
  poolMatches?: PoolMatchResult[];
  winnerPhotos: { src: string; alt: string }[];
  blurb: string;
};

export const TOURNAMENT_ARCHIVE: TournamentArchiveEntry[] = [
  {
    slug: "jvc-mixed-2v2-beach",
    title: "JVC Mixed 2v2 Beach Tournament",
    dateLabel: "Saturday, 18 July 2026",
    location: "Sport Ireland Campus, Dublin, Blanchardstown",
    status: "completed",
    heroTitle: "Mixed 2v2",
    heroHighlight: "Champions",
    blurb:
      "Ten teams. Two pools. One sun-soaked day on the sand — Jackals hosted Dublin’s Mixed 2v2 Beach showdown.",
    poolAdvanceNote: "Top 2 advanced to the play-offs",
    poolHighlight: "top-two",
    poolMatches: [
      {
        pool: "Pool A",
        time: "10:00",
        court: "Court 1",
        teamA: "Gattis",
        teamB: "Les Whiskas",
        sets: [[8, 21]],
        winner: "Les Whiskas",
        referee: "You & I",
      },
      {
        pool: "Pool A",
        time: "10:17",
        court: "Court 1",
        teamA: "Double Trouble",
        teamB: "High Rollers Club",
        sets: [[21, 16]],
        winner: "Double Trouble",
        referee: "Pareja Explosiva",
      },
      {
        pool: "Pool A",
        time: "10:34",
        court: "Court 1",
        teamA: "Still",
        teamB: "Les Whiskas",
        sets: [[21, 19]],
        winner: "Still",
        referee: "R.O.U.S",
      },
      {
        pool: "Pool A",
        time: "10:51",
        court: "Court 1",
        teamA: "Gattis",
        teamB: "Double Trouble",
        sets: [[19, 21]],
        winner: "Double Trouble",
        referee: "Bilowilo",
      },
      {
        pool: "Pool A",
        time: "11:08",
        court: "Court 1",
        teamA: "High Rollers Club",
        teamB: "Still",
        sets: [[14, 21]],
        winner: "Still",
        referee: "The Smurfs",
      },
      {
        pool: "Pool A",
        time: "11:25",
        court: "Court 1",
        teamA: "Double Trouble",
        teamB: "Les Whiskas",
        sets: [[21, 12]],
        winner: "Double Trouble",
        referee: "R.O.U.S",
      },
      {
        pool: "Pool A",
        time: "11:42",
        court: "Court 1",
        teamA: "Gattis",
        teamB: "Still",
        sets: [[16, 21]],
        winner: "Still",
        referee: "Bilowilo",
      },
      {
        pool: "Pool A",
        time: "11:59",
        court: "Court 1",
        teamA: "High Rollers Club",
        teamB: "Les Whiskas",
        sets: [[21, 15]],
        winner: "High Rollers Club",
        referee: "You & I",
      },
      {
        pool: "Pool A",
        time: "12:16",
        court: "Court 1",
        teamA: "Double Trouble",
        teamB: "Still",
        sets: [[21, 11]],
        winner: "Double Trouble",
        referee: "The Smurfs",
      },
      {
        pool: "Pool A",
        time: "12:33",
        court: "Court 1",
        teamA: "Gattis",
        teamB: "High Rollers Club",
        sets: [[21, 15]],
        winner: "Gattis",
        referee: "Pareja Explosiva",
      },
      {
        pool: "Pool B",
        time: "10:00",
        court: "Court 2",
        teamA: "The Smurfs",
        teamB: "R.O.U.S",
        sets: [[18, 21]],
        winner: "R.O.U.S",
        referee: "Double Trouble",
      },
      {
        pool: "Pool B",
        time: "10:17",
        court: "Court 2",
        teamA: "You & I",
        teamB: "Bilowilo",
        sets: [[14, 21]],
        winner: "Bilowilo",
        referee: "Still",
      },
      {
        pool: "Pool B",
        time: "10:34",
        court: "Court 2",
        teamA: "The Smurfs",
        teamB: "Pareja Explosiva",
        sets: [[21, 10]],
        winner: "The Smurfs",
        referee: "High Rollers Club",
      },
      {
        pool: "Pool B",
        time: "10:51",
        court: "Court 2",
        teamA: "R.O.U.S",
        teamB: "You & I",
        sets: [[14, 21]],
        winner: "You & I",
        referee: "Les Whiskas",
      },
      {
        pool: "Pool B",
        time: "11:08",
        court: "Court 2",
        teamA: "Bilowilo",
        teamB: "Pareja Explosiva",
        sets: [[21, 14]],
        winner: "Bilowilo",
        referee: "Gattis",
      },
      {
        pool: "Pool B",
        time: "11:25",
        court: "Court 2",
        teamA: "The Smurfs",
        teamB: "You & I",
        sets: [[21, 11]],
        winner: "The Smurfs",
        referee: "High Rollers Club",
      },
      {
        pool: "Pool B",
        time: "11:42",
        court: "Court 2",
        teamA: "Pareja Explosiva",
        teamB: "R.O.U.S",
        sets: [[14, 21]],
        winner: "R.O.U.S",
        referee: "Double Trouble",
      },
      {
        pool: "Pool B",
        time: "11:59",
        court: "Court 2",
        teamA: "Bilowilo",
        teamB: "The Smurfs",
        sets: [[9, 21]],
        winner: "The Smurfs",
        referee: "Gattis",
      },
      {
        pool: "Pool B",
        time: "12:16",
        court: "Court 2",
        teamA: "Pareja Explosiva",
        teamB: "You & I",
        sets: [[21, 15]],
        winner: "Pareja Explosiva",
        referee: "Les Whiskas",
      },
      {
        pool: "Pool B",
        time: "12:33",
        court: "Court 2",
        teamA: "Bilowilo",
        teamB: "R.O.U.S",
        sets: [[21, 16]],
        winner: "Bilowilo",
        referee: "Still",
      },
    ],
    podium: [
      { place: 1, team: "Double Trouble" },
      { place: 2, team: "The Smurfs" },
      { place: 3, team: "Bilowilo" },
    ],
    pools: [
      {
        name: "Pool A",
        rows: [
          {
            rank: 1,
            team: "Double Trouble",
            points: 12,
            wins: 4,
            losses: 0,
            scoreDiff: 26,
          },
          {
            rank: 2,
            team: "Still",
            points: 9,
            wins: 3,
            losses: 1,
            scoreDiff: 4,
          },
          {
            rank: 3,
            team: "Les Whiskas",
            points: 3,
            wins: 1,
            losses: 3,
            scoreDiff: -4,
            h2hWins: 1,
            h2hDiff: 7,
          },
          {
            rank: 4,
            team: "High Rollers Club",
            points: 3,
            wins: 1,
            losses: 3,
            scoreDiff: -12,
            h2hWins: 1,
            h2hDiff: 0,
          },
          {
            rank: 5,
            team: "Gattis",
            points: 3,
            wins: 1,
            losses: 3,
            scoreDiff: -14,
            h2hWins: 1,
            h2hDiff: -7,
          },
        ],
      },
      {
        name: "Pool B",
        rows: [
          {
            rank: 1,
            team: "The Smurfs",
            points: 9,
            wins: 3,
            losses: 1,
            scoreDiff: 30,
            h2hWins: 1,
            h2hDiff: 12,
          },
          {
            rank: 2,
            team: "Bilowilo",
            points: 9,
            wins: 3,
            losses: 1,
            scoreDiff: 7,
            h2hDiff: -12,
          },
          {
            rank: 3,
            team: "R.O.U.S",
            points: 6,
            wins: 2,
            losses: 2,
            scoreDiff: -2,
          },
          {
            rank: 4,
            team: "Pareja Explosiva",
            points: 3,
            wins: 1,
            losses: 3,
            scoreDiff: -19,
            h2hWins: 1,
            h2hDiff: 6,
          },
          {
            rank: 5,
            team: "You & I",
            points: 3,
            wins: 1,
            losses: 3,
            scoreDiff: -16,
            h2hDiff: -6,
          },
        ],
      },
    ],
    playoffs: [
      {
        round: "final",
        label: "Championship Final",
        teamA: "Double Trouble",
        teamB: "The Smurfs",
        seedA: "A1",
        seedB: "B1",
        sets: [
          [21, 11],
          [19, 21],
          [21, 13],
        ],
        winner: "Double Trouble",
      },
      {
        round: "semi",
        label: "Semi-final 1",
        teamA: "Double Trouble",
        teamB: "Bilowilo",
        seedA: "A1",
        seedB: "B2",
        sets: [
          [21, 10],
          [21, 10],
        ],
        winner: "Double Trouble",
      },
      {
        round: "semi",
        label: "Semi-final 2",
        teamA: "Still",
        teamB: "The Smurfs",
        seedA: "A2",
        seedB: "B1",
        sets: [
          [15, 21],
          [13, 21],
        ],
        winner: "The Smurfs",
      },
      {
        round: "third",
        label: "3rd Place Match",
        teamA: "Bilowilo",
        teamB: "Still",
        seedA: "B2",
        seedB: "A2",
        sets: [
          [16, 10],
          [8, 16],
          [16, 14],
        ],
        winner: "Bilowilo",
      },
    ],
    winnerPhotos: [],
  },
  {
    slug: "jvc-rose-cup-shield",
    title: "JVC Rose Cup & Shield — Mixed Tournament",
    dateLabel: "Sunday, 16 February 2025",
    location: "Dublin",
    status: "completed",
    heroTitle: "Rose Cup",
    heroHighlight: "& Shield",
    blurb:
      "Eight mixed teams, two pools, then a split knockout — top two into the Rose Cup, bottom two into the Rose Shield. No third-place matches: only winners and runners-up.",
    poolAdvanceNote:
      "Top 2 → Rose Cup play-offs · Bottom 2 → Rose Shield play-offs",
    poolHighlight: "cup-and-shield",
    poolMatches: [
      {
        pool: "Pool A",
        time: "10:00",
        court: "Court 1",
        teamA: "ADLERS",
        teamB: "I.V.I SET FIGHTERS",
        sets: [
          [15, 11],
          [12, 15],
        ],
        winner: null,
        referee: "WALRUS",
      },
      {
        pool: "Pool A",
        time: "10:25",
        court: "Court 1",
        teamA: "ADLERS",
        teamB: "IADT Geckos",
        sets: [
          [15, 8],
          [15, 13],
        ],
        winner: "ADLERS",
        referee: "Labubus",
      },
      {
        pool: "Pool A",
        time: "10:50",
        court: "Court 1",
        teamA: "I.V.I SET FIGHTERS",
        teamB: "IADT Turtles",
        sets: [
          [15, 5],
          [15, 8],
        ],
        winner: "I.V.I SET FIGHTERS",
        referee: "NoMercy",
      },
      {
        pool: "Pool A",
        time: "11:15",
        court: "Court 1",
        teamA: "IADT Geckos",
        teamB: "IADT Turtles",
        sets: [
          [14, 15],
          [15, 10],
        ],
        winner: null,
        referee: "Athenas",
      },
      {
        pool: "Pool A",
        time: "11:40",
        court: "Court 1",
        teamA: "I.V.I SET FIGHTERS",
        teamB: "IADT Geckos",
        sets: [
          [15, 8],
          [15, 9],
        ],
        winner: "I.V.I SET FIGHTERS",
        referee: "WALRUS",
      },
      {
        pool: "Pool A",
        time: "12:05",
        court: "Court 1",
        teamA: "ADLERS",
        teamB: "IADT Turtles",
        sets: [
          [15, 3],
          [15, 6],
        ],
        winner: "ADLERS",
        referee: "Labubus",
      },
      {
        pool: "Pool B",
        time: "10:00",
        court: "Court 2",
        teamA: "Athenas",
        teamB: "Labubus",
        sets: [
          [14, 15],
          [15, 7],
        ],
        winner: null,
        referee: "IADT Geckos",
      },
      {
        pool: "Pool B",
        time: "10:25",
        court: "Court 2",
        teamA: "Athenas",
        teamB: "NoMercy",
        sets: [
          [14, 15],
          [10, 15],
        ],
        winner: "NoMercy",
        referee: "IADT Turtles",
      },
      {
        pool: "Pool B",
        time: "10:50",
        court: "Court 2",
        teamA: "Labubus",
        teamB: "WALRUS",
        sets: [
          [15, 4],
          [15, 6],
        ],
        winner: "Labubus",
        referee: "IADT Geckos",
      },
      {
        pool: "Pool B",
        time: "11:15",
        court: "Court 2",
        teamA: "NoMercy",
        teamB: "WALRUS",
        sets: [
          [15, 4],
          [15, 8],
        ],
        winner: "NoMercy",
        referee: "I.V.I SET FIGHTERS",
      },
      {
        pool: "Pool B",
        time: "11:40",
        court: "Court 2",
        teamA: "Labubus",
        teamB: "NoMercy",
        sets: [
          [10, 15],
          [15, 12],
        ],
        winner: null,
        referee: "ADLERS",
      },
      {
        pool: "Pool B",
        time: "12:05",
        court: "Court 2",
        teamA: "Athenas",
        teamB: "WALRUS",
        sets: [
          [12, 15],
          [15, 12],
        ],
        winner: null,
        referee: "IADT Turtles",
      },
    ],
    podium: [
      { place: 1, team: "I.V.I SET FIGHTERS" },
      { place: 2, team: "ADLERS" },
    ],
    pools: [
      {
        name: "Pool A",
        rows: [
          {
            rank: 1,
            team: "ADLERS",
            points: 7,
            wins: 2,
            losses: 0,
            draws: 1,
            scoreDiff: 31,
          },
          {
            rank: 2,
            team: "I.V.I SET FIGHTERS",
            points: 7,
            wins: 2,
            losses: 0,
            draws: 1,
            scoreDiff: 29,
          },
          {
            rank: 3,
            team: "IADT Geckos",
            points: 1,
            wins: 0,
            losses: 2,
            draws: 1,
            scoreDiff: -18,
          },
          {
            rank: 4,
            team: "IADT Turtles",
            points: 1,
            wins: 0,
            losses: 2,
            draws: 1,
            scoreDiff: -42,
          },
        ],
      },
      {
        name: "Pool B",
        rows: [
          {
            rank: 1,
            team: "NoMercy",
            points: 7,
            wins: 2,
            losses: 0,
            draws: 1,
            scoreDiff: 26,
          },
          {
            rank: 2,
            team: "Labubus",
            points: 5,
            wins: 1,
            losses: 0,
            draws: 2,
            scoreDiff: 11,
          },
          {
            rank: 3,
            team: "Athenas",
            points: 2,
            wins: 0,
            losses: 1,
            draws: 2,
            scoreDiff: -11,
          },
          {
            rank: 4,
            team: "WALRUS",
            points: 1,
            wins: 0,
            losses: 2,
            draws: 1,
            scoreDiff: -38,
          },
        ],
      },
    ],
    playoffs: [],
    brackets: [
      {
        key: "rose-cup",
        name: "Rose Cup",
        blurb:
          "Pool finishers 1st & 2nd from each group. Semi-finals into a Cup final — no 3rd-place match.",
        podium: [
          { place: 1, team: "I.V.I SET FIGHTERS" },
          { place: 2, team: "ADLERS" },
        ],
        matches: [
          {
            round: "semi",
            label: "Cup Semi-final 1",
            teamA: "ADLERS",
            teamB: "Labubus",
            seedA: "A1",
            seedB: "B2",
            sets: [
              [21, 19],
              [21, 17],
            ],
            winner: "ADLERS",
          },
          {
            round: "semi",
            label: "Cup Semi-final 2",
            teamA: "I.V.I SET FIGHTERS",
            teamB: "NoMercy",
            seedA: "A2",
            seedB: "B1",
            sets: [
              [21, 13],
              [21, 19],
            ],
            winner: "I.V.I SET FIGHTERS",
          },
          {
            round: "final",
            label: "Rose Cup Final",
            teamA: "ADLERS",
            teamB: "I.V.I SET FIGHTERS",
            seedA: "A1",
            seedB: "A2",
            sets: [
              [13, 21],
              [15, 21],
            ],
            winner: "I.V.I SET FIGHTERS",
          },
        ],
      },
      {
        key: "rose-shield",
        name: "Rose Shield",
        blurb:
          "Pool finishers 3rd & 4th from each group. Semi-finals into a Shield final — no 3rd-place match.",
        podium: [
          { place: 1, team: "IADT Geckos" },
          { place: 2, team: "IADT Turtles" },
        ],
        matches: [
          {
            round: "semi",
            label: "Shield Semi-final 1",
            teamA: "Athenas",
            teamB: "IADT Turtles",
            seedA: "B3",
            seedB: "A4",
            sets: [
              [21, 11],
              [16, 21],
              [9, 15],
            ],
            winner: "IADT Turtles",
          },
          {
            round: "semi",
            label: "Shield Semi-final 2",
            teamA: "WALRUS",
            teamB: "IADT Geckos",
            seedA: "B4",
            seedB: "A3",
            sets: [
              [15, 21],
              [9, 21],
            ],
            winner: "IADT Geckos",
          },
          {
            round: "final",
            label: "Rose Shield Final",
            teamA: "IADT Turtles",
            teamB: "IADT Geckos",
            seedA: "A4",
            seedB: "A3",
            sets: [
              [20, 25],
              [15, 9],
              [12, 15],
            ],
            winner: "IADT Geckos",
          },
        ],
      },
    ],
    winnerPhotos: [],
  },
];

export function getTournamentArchiveBySlug(slug: string) {
  return TOURNAMENT_ARCHIVE.find((entry) => entry.slug === slug) ?? null;
}

export function getCompletedTournaments() {
  return TOURNAMENT_ARCHIVE.filter((entry) => entry.status === "completed");
}
