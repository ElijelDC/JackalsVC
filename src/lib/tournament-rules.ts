export const TOURNAMENT_RULES = {
  title: "Mixed Beach 2v2 Tournament",
  club: "Jackals VC",
  dateLabel: "Saturday, 18 July 2026",
  venue: "Sport Ireland Campus Multi Sport Pitches",
  introWindow: "9:45 – 10:00",
  matchStart: "10:00",
  website: "jackalsvolleyball.com",
  slogan: "Good luck to all teams!",
  nav: [
    {
      num: "1",
      title: "Tournament Overview",
      blurb: "Teams, pools and qualification route",
    },
    {
      num: "2",
      title: "Court Rules",
      blurb: "Side changes, grace period and forfeits",
    },
    {
      num: "3",
      title: "Substitutions",
      blurb: "Sub limits per gender during a set",
    },
    {
      num: "4",
      title: "Match Format",
      blurb: "Group stages, knockout stages, scoring and time limits",
    },
    {
      num: "5",
      title: "Group Stage Advancement",
      blurb: "How teams qualify for knockout stages",
    },
    {
      num: "6",
      title: "Refereeing and Scorekeeping Duties",
      blurb: "Who referees, tracks score and time",
    },
    {
      num: "7",
      title: "Proposed Tournament Schedule",
      blurb: "Indicative timeline from intro to awards",
    },
    {
      num: "8",
      title: "Tournament Spirit",
      blurb: "Readiness, respect and competitive play",
    },
  ],
  overview: [
    "10 teams competing",
    "Teams will be split into 2 pools of 5.",
    "Each pool will play a round-robin format.",
    "Every team plays every other team in their pool once.",
    "Each team is guaranteed 4 group-stage matches.",
    "Top 2 teams from each pool advance to the semi-finals.",
  ],
  courtRulesIntro:
    "These rules apply to the group stages, semi-finals, 3rd place decider, and tournament final.",
  sideChanges: [
    "Teams switch sides every 7 total points played.",
    "Examples: combined score reaches 7, 14, 21, 28, and so on.",
  ],
  matchTurnaround: [
    "Teams should be ready courtside before their scheduled match time.",
    "Strict 2-minute grace period to show up for a scheduled match.",
    "If a team fails to show up within 2 minutes, they will be forfeited.",
  ],
  substitutions: [
    "Only 1 sub per each gender can be made during a set.",
  ],
  groupStages: [
    "1 set to 21 points (no deuce)",
    "Maximum match time: 15 minutes.",
    "A match finishes when a team reaches 21 points or the 15-minute time limit expires.",
    "If time expires, complete the rally in progress.",
    "The team leading in points wins.",
    "If a match is tied after time limit expires, play one golden point.",
  ],
  semiFinals: [
    "Best of 3 sets",
    "Sets 1 and 2: First to 21 points (win by two), maximum 15 minutes per set.",
    "Set 3, if required: First to 15 points (win by two), maximum 10 minutes.",
    "If a time limit expires, complete the rally in progress.",
    "The team leading wins the set.",
    "If the set is tied after time limit expires, play one golden point.",
  ],
  thirdPlace: [
    "1 set to 21 points.",
    "Maximum match time: 15 minutes.",
    "If time expires, complete the rally in progress.",
    "The team leading wins.",
    "If a match is tied after time limit expires, play one golden point.",
  ],
  championshipFinal: [
    "Best of 3 sets",
    "All Sets: First to 21 points",
    "Win By Two Points",
  ],
  finalTimeLimitNote:
    "The Final will normally be played without a time limit. If the tournament is running behind schedule, the Tournament Organisers may introduce a time limit before the Final begins to ensure the tournament finishes within the court's booking limit.",
  finalFallbackNote:
    "In a case where the tournament is falling behind drastically and a time limit must be put in place, it will then follow the semi-finals format; however, all 3 sets will be first to 21 points (win by two), maximum 15 minutes for all sets.",
  advancementIntro:
    "Teams are determined to advance into knockouts stages based off:",
  advancement: [
    "Match wins",
    "Point differences",
    "Head-to-head result",
  ],
  refereeingIntro:
    "This is a self-refereed tournament. Each team will have referee responsibilities during the group stages. As it is a 2v2 tournament, there will only be one single referee needed to officiate a match as there could be people entering as duo's only without any subs.",
  refereeAssign: [
    "Keep Score and Track of Time Limit",
    "Referee the Game (Outs, Net Touches, etc.) Leniency on Double Touch Rule*",
  ],
  refereeReady: "Please ensure your team is ready for the above duties",
  scheduleNote: "Proposed Tournament Schedule (Not the EXACT schedule)",
  schedule: [
    { time: "09:45", activity: "Arrival, Tournament Introduction" },
    { time: "10:00", activity: "Group Stage Starts" },
    { time: "12:55", activity: "Group Stage Finishes" },
    {
      time: "12:55–13:10",
      activity: "Play-off Announcement and Short break",
    },
    { time: "13:10", activity: "Semi-finals" },
    { time: "14:00", activity: "3rd Place Decider" },
    { time: "14:20", activity: "Championship Final" },
  ],
  spirit: [
    "Arrive on time.",
    "Be ready for your matches.",
    "Bring a packed lunch and plenty of water! (water fountain available)",
    "Respect your opponents and the referee.",
    "Enjoy competitive beach volleyball.",
  ],
  closing: "Good luck to all teams!",
} as const;
