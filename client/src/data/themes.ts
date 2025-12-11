export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  glow: string;
}

export type ThemeCategory = 
  | "classic" 
  | "nfl" | "mlb" | "nba" | "nhl" | "mls" 
  | "epl" | "laliga" | "bundesliga" | "seriea" | "ligue1"
  | "golf" | "tennis"
  | "nature" | "space"
  | "solid" | "pastel" | "pattern"
  | "partner";

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  watermark?: string;
  category: ThemeCategory;
  isFree?: boolean;
}

const createTheme = (
  id: string,
  name: string,
  category: ThemeCategory,
  primary: string,
  secondary: string,
  accent: string,
  background: string,
  cardBg: string,
  textPrimary: string,
  textSecondary: string,
  border: string,
  glow: string,
  watermark?: string
): Theme => ({
  id,
  name,
  category,
  watermark,
  colors: { primary, secondary, accent, background, cardBg, textPrimary, textSecondary, border, glow }
});

const createTeamTheme = (
  id: string,
  name: string,
  category: ThemeCategory,
  primaryGradient: string,
  secondaryGradient: string,
  accentColor: string,
  glowColor: string,
  logoUrl?: string
): Theme => ({
  id,
  name,
  category,
  watermark: logoUrl,
  colors: {
    primary: primaryGradient,
    secondary: secondaryGradient,
    accent: accentColor,
    background: "bg-slate-950",
    cardBg: "bg-slate-900/80",
    textPrimary: "text-white",
    textSecondary: "text-slate-300",
    border: "border-white/10",
    glow: glowColor
  }
});

export const allThemes: Theme[] = [
  // ============ CLASSIC THEMES ============
  createTheme(
    "orby-aqua", "Orby Aqua (Default)", "classic",
    "from-slate-950 via-slate-900 to-slate-950",
    "from-cyan-500 to-teal-500",
    "bg-cyan-500", "bg-slate-950", "bg-slate-900/80",
    "text-white", "text-slate-300", "border-cyan-500/30", "shadow-cyan-500/20"
  ),
  createTheme(
    "light-mode", "Light Mode", "classic",
    "from-slate-100 via-white to-slate-100",
    "from-cyan-500 to-teal-500",
    "bg-cyan-600", "bg-slate-50", "bg-white",
    "text-slate-900", "text-slate-600", "border-cyan-500/40", "shadow-cyan-500/10"
  ),
  createTheme(
    "dark-mode", "Dark Mode", "classic",
    "from-zinc-950 via-zinc-900 to-zinc-950",
    "from-slate-500 to-slate-600",
    "bg-slate-500", "bg-zinc-950", "bg-zinc-900/80",
    "text-white", "text-zinc-400", "border-white/10", "shadow-slate-500/20"
  ),
  createTheme(
    "pure-black", "Pure Black (OLED)", "classic",
    "from-black via-black to-black",
    "from-cyan-500 to-blue-500",
    "bg-cyan-500", "bg-black", "bg-zinc-950",
    "text-white", "text-zinc-400", "border-white/5", "shadow-cyan-500/20"
  ),
  createTheme(
    "midnight-blue", "Midnight Blue", "classic",
    "from-blue-950 via-slate-900 to-blue-950",
    "from-blue-500 to-indigo-500",
    "bg-blue-500", "bg-blue-950", "bg-slate-900/80",
    "text-white", "text-blue-200", "border-blue-500/30", "shadow-blue-500/20"
  ),
  createTheme(
    "emerald-night", "Emerald Night", "classic",
    "from-emerald-950 via-slate-900 to-emerald-950",
    "from-emerald-500 to-green-500",
    "bg-emerald-500", "bg-emerald-950", "bg-slate-900/80",
    "text-white", "text-emerald-200", "border-emerald-500/30", "shadow-emerald-500/20"
  ),
  createTheme(
    "royal-purple", "Royal Purple", "classic",
    "from-purple-950 via-slate-900 to-purple-950",
    "from-purple-500 to-violet-500",
    "bg-purple-500", "bg-purple-950", "bg-slate-900/80",
    "text-white", "text-purple-200", "border-purple-500/30", "shadow-purple-500/20"
  ),
  createTheme(
    "crimson-dark", "Crimson Dark", "classic",
    "from-red-950 via-slate-900 to-red-950",
    "from-red-500 to-rose-500",
    "bg-red-500", "bg-red-950", "bg-slate-900/80",
    "text-white", "text-red-200", "border-red-500/30", "shadow-red-500/20"
  ),

  // ============ NFL TEAMS (32) ============
  createTeamTheme("titans", "Tennessee Titans", "nfl", "from-blue-950 via-sky-800 to-blue-950", "from-sky-500 to-red-500", "bg-sky-500", "shadow-sky-500/30"),
  createTeamTheme("bills", "Buffalo Bills", "nfl", "from-blue-900 via-red-800 to-blue-900", "from-blue-500 to-red-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("dolphins", "Miami Dolphins", "nfl", "from-teal-900 via-orange-700 to-teal-900", "from-teal-500 to-orange-500", "bg-teal-500", "shadow-teal-500/30"),
  createTeamTheme("patriots", "New England Patriots", "nfl", "from-blue-950 via-red-800 to-blue-950", "from-blue-600 to-red-600", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("jets", "New York Jets", "nfl", "from-green-900 via-slate-800 to-green-900", "from-green-500 to-white", "bg-green-600", "shadow-green-500/30"),
  createTeamTheme("ravens", "Baltimore Ravens", "nfl", "from-purple-950 via-slate-800 to-purple-950", "from-purple-500 to-yellow-500", "bg-purple-600", "shadow-purple-500/30"),
  createTeamTheme("bengals", "Cincinnati Bengals", "nfl", "from-orange-900 via-slate-900 to-orange-900", "from-orange-500 to-black", "bg-orange-500", "shadow-orange-500/30"),
  createTeamTheme("browns", "Cleveland Browns", "nfl", "from-orange-800 via-amber-900 to-orange-800", "from-orange-500 to-amber-600", "bg-orange-600", "shadow-orange-500/30"),
  createTeamTheme("steelers", "Pittsburgh Steelers", "nfl", "from-yellow-600 via-slate-900 to-yellow-600", "from-yellow-400 to-black", "bg-yellow-500", "shadow-yellow-500/30"),
  createTeamTheme("texans", "Houston Texans", "nfl", "from-blue-950 via-red-900 to-blue-950", "from-blue-600 to-red-600", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("colts", "Indianapolis Colts", "nfl", "from-blue-800 via-slate-800 to-blue-800", "from-blue-500 to-white", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("jaguars", "Jacksonville Jaguars", "nfl", "from-teal-900 via-yellow-700 to-teal-900", "from-teal-500 to-yellow-500", "bg-teal-600", "shadow-teal-500/30"),
  createTeamTheme("chiefs", "Kansas City Chiefs", "nfl", "from-red-800 via-yellow-600 to-red-800", "from-red-500 to-yellow-400", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("raiders", "Las Vegas Raiders", "nfl", "from-slate-900 via-slate-800 to-slate-900", "from-slate-400 to-black", "bg-slate-500", "shadow-slate-400/30"),
  createTeamTheme("chargers", "Los Angeles Chargers", "nfl", "from-blue-800 via-yellow-500 to-blue-800", "from-blue-500 to-yellow-400", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("broncos", "Denver Broncos", "nfl", "from-orange-700 via-blue-900 to-orange-700", "from-orange-500 to-blue-600", "bg-orange-500", "shadow-orange-500/30"),
  createTeamTheme("cowboys", "Dallas Cowboys", "nfl", "from-blue-900 via-slate-700 to-blue-900", "from-blue-500 to-slate-400", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("giants", "New York Giants", "nfl", "from-blue-900 via-red-800 to-blue-900", "from-blue-600 to-red-600", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("eagles", "Philadelphia Eagles", "nfl", "from-green-900 via-slate-700 to-green-900", "from-green-500 to-slate-400", "bg-green-600", "shadow-green-500/30"),
  createTeamTheme("commanders", "Washington Commanders", "nfl", "from-red-900 via-yellow-700 to-red-900", "from-red-600 to-yellow-500", "bg-red-700", "shadow-red-500/30"),
  createTeamTheme("bears", "Chicago Bears", "nfl", "from-blue-950 via-orange-800 to-blue-950", "from-blue-600 to-orange-500", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("lions", "Detroit Lions", "nfl", "from-blue-800 via-slate-700 to-blue-800", "from-blue-500 to-slate-400", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("packers", "Green Bay Packers", "nfl", "from-green-800 via-yellow-600 to-green-800", "from-green-500 to-yellow-400", "bg-green-600", "shadow-green-500/30"),
  createTeamTheme("vikings", "Minnesota Vikings", "nfl", "from-purple-900 via-yellow-600 to-purple-900", "from-purple-500 to-yellow-400", "bg-purple-600", "shadow-purple-500/30"),
  createTeamTheme("falcons", "Atlanta Falcons", "nfl", "from-red-900 via-slate-800 to-red-900", "from-red-500 to-black", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("panthers", "Carolina Panthers", "nfl", "from-blue-900 via-slate-800 to-blue-900", "from-blue-500 to-black", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("saints", "New Orleans Saints", "nfl", "from-yellow-600 via-slate-900 to-yellow-600", "from-yellow-400 to-black", "bg-yellow-500", "shadow-yellow-500/30"),
  createTeamTheme("buccaneers", "Tampa Bay Buccaneers", "nfl", "from-red-800 via-slate-800 to-red-800", "from-red-500 to-orange-500", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("cardinals", "Arizona Cardinals", "nfl", "from-red-800 via-slate-800 to-red-800", "from-red-500 to-white", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("rams", "Los Angeles Rams", "nfl", "from-blue-800 via-yellow-600 to-blue-800", "from-blue-500 to-yellow-400", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("49ers", "San Francisco 49ers", "nfl", "from-red-800 via-yellow-600 to-red-800", "from-red-500 to-yellow-400", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("seahawks", "Seattle Seahawks", "nfl", "from-blue-900 via-green-700 to-blue-900", "from-blue-500 to-green-500", "bg-blue-600", "shadow-blue-500/30"),

  // ============ MLB TEAMS (30) ============
  createTeamTheme("yankees", "New York Yankees", "mlb", "from-blue-950 via-slate-800 to-blue-950", "from-blue-600 to-white", "bg-blue-800", "shadow-blue-500/30"),
  createTeamTheme("redsox", "Boston Red Sox", "mlb", "from-red-900 via-slate-800 to-red-900", "from-red-500 to-white", "bg-red-700", "shadow-red-500/30"),
  createTeamTheme("dodgers", "Los Angeles Dodgers", "mlb", "from-blue-800 via-slate-800 to-blue-800", "from-blue-500 to-white", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("cubs", "Chicago Cubs", "mlb", "from-blue-800 via-red-700 to-blue-800", "from-blue-500 to-red-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("whitesox", "Chicago White Sox", "mlb", "from-slate-900 via-slate-800 to-slate-900", "from-slate-400 to-black", "bg-slate-600", "shadow-slate-500/30"),
  createTeamTheme("mets", "New York Mets", "mlb", "from-blue-800 via-orange-700 to-blue-800", "from-blue-500 to-orange-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("phillies", "Philadelphia Phillies", "mlb", "from-red-800 via-slate-800 to-red-800", "from-red-500 to-white", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("braves", "Atlanta Braves", "mlb", "from-blue-950 via-red-800 to-blue-950", "from-blue-600 to-red-500", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("astros", "Houston Astros", "mlb", "from-orange-800 via-blue-900 to-orange-800", "from-orange-500 to-blue-600", "bg-orange-600", "shadow-orange-500/30"),
  createTeamTheme("rangers", "Texas Rangers", "mlb", "from-blue-800 via-red-700 to-blue-800", "from-blue-500 to-red-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("giants-mlb", "San Francisco Giants", "mlb", "from-orange-800 via-slate-900 to-orange-800", "from-orange-500 to-black", "bg-orange-600", "shadow-orange-500/30"),
  createTeamTheme("athletics", "Oakland Athletics", "mlb", "from-green-800 via-yellow-600 to-green-800", "from-green-500 to-yellow-400", "bg-green-600", "shadow-green-500/30"),
  createTeamTheme("padres", "San Diego Padres", "mlb", "from-amber-800 via-slate-900 to-amber-800", "from-amber-500 to-slate-600", "bg-amber-600", "shadow-amber-500/30"),
  createTeamTheme("angels", "Los Angeles Angels", "mlb", "from-red-800 via-slate-800 to-red-800", "from-red-500 to-white", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("mariners", "Seattle Mariners", "mlb", "from-teal-900 via-blue-800 to-teal-900", "from-teal-500 to-blue-500", "bg-teal-600", "shadow-teal-500/30"),
  createTeamTheme("twins", "Minnesota Twins", "mlb", "from-blue-950 via-red-800 to-blue-950", "from-blue-600 to-red-500", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("tigers", "Detroit Tigers", "mlb", "from-blue-950 via-orange-700 to-blue-950", "from-blue-600 to-orange-500", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("royals", "Kansas City Royals", "mlb", "from-blue-800 via-slate-800 to-blue-800", "from-blue-500 to-white", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("guardians", "Cleveland Guardians", "mlb", "from-red-800 via-blue-900 to-red-800", "from-red-500 to-blue-600", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("orioles", "Baltimore Orioles", "mlb", "from-orange-800 via-slate-900 to-orange-800", "from-orange-500 to-black", "bg-orange-600", "shadow-orange-500/30"),
  createTeamTheme("rays", "Tampa Bay Rays", "mlb", "from-blue-900 via-yellow-600 to-blue-900", "from-blue-500 to-yellow-400", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("bluejays", "Toronto Blue Jays", "mlb", "from-blue-800 via-slate-800 to-blue-800", "from-blue-500 to-white", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("nationals", "Washington Nationals", "mlb", "from-red-800 via-blue-900 to-red-800", "from-red-500 to-blue-600", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("marlins", "Miami Marlins", "mlb", "from-slate-900 via-cyan-700 to-slate-900", "from-cyan-500 to-red-500", "bg-cyan-600", "shadow-cyan-500/30"),
  createTeamTheme("reds", "Cincinnati Reds", "mlb", "from-red-800 via-slate-800 to-red-800", "from-red-500 to-white", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("brewers", "Milwaukee Brewers", "mlb", "from-blue-950 via-yellow-600 to-blue-950", "from-blue-600 to-yellow-400", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("pirates", "Pittsburgh Pirates", "mlb", "from-yellow-600 via-slate-900 to-yellow-600", "from-yellow-400 to-black", "bg-yellow-500", "shadow-yellow-500/30"),
  createTeamTheme("cardinals-mlb", "St. Louis Cardinals", "mlb", "from-red-800 via-slate-800 to-red-800", "from-red-500 to-yellow-400", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("dbacks", "Arizona Diamondbacks", "mlb", "from-red-900 via-teal-800 to-red-900", "from-red-500 to-teal-500", "bg-red-700", "shadow-red-500/30"),
  createTeamTheme("rockies", "Colorado Rockies", "mlb", "from-purple-900 via-slate-800 to-purple-900", "from-purple-500 to-black", "bg-purple-600", "shadow-purple-500/30"),

  // ============ NBA TEAMS (30) ============
  createTeamTheme("lakers", "Los Angeles Lakers", "nba", "from-purple-800 via-yellow-600 to-purple-800", "from-purple-500 to-yellow-400", "bg-purple-600", "shadow-purple-500/30"),
  createTeamTheme("celtics", "Boston Celtics", "nba", "from-green-800 via-slate-800 to-green-800", "from-green-500 to-white", "bg-green-600", "shadow-green-500/30"),
  createTeamTheme("warriors", "Golden State Warriors", "nba", "from-blue-800 via-yellow-600 to-blue-800", "from-blue-500 to-yellow-400", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("heat", "Miami Heat", "nba", "from-red-800 via-yellow-600 to-red-800", "from-red-500 to-yellow-400", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("bulls", "Chicago Bulls", "nba", "from-red-800 via-slate-900 to-red-800", "from-red-500 to-black", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("knicks", "New York Knicks", "nba", "from-blue-800 via-orange-700 to-blue-800", "from-blue-500 to-orange-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("nets", "Brooklyn Nets", "nba", "from-slate-900 via-slate-800 to-slate-900", "from-slate-400 to-white", "bg-slate-600", "shadow-slate-500/30"),
  createTeamTheme("sixers", "Philadelphia 76ers", "nba", "from-blue-800 via-red-700 to-blue-800", "from-blue-500 to-red-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("raptors", "Toronto Raptors", "nba", "from-red-800 via-slate-900 to-red-800", "from-red-500 to-black", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("bucks", "Milwaukee Bucks", "nba", "from-green-800 via-slate-800 to-green-800", "from-green-500 to-amber-200", "bg-green-600", "shadow-green-500/30"),
  createTeamTheme("cavaliers", "Cleveland Cavaliers", "nba", "from-red-900 via-yellow-600 to-red-900", "from-red-600 to-yellow-400", "bg-red-700", "shadow-red-500/30"),
  createTeamTheme("pistons", "Detroit Pistons", "nba", "from-blue-800 via-red-700 to-blue-800", "from-blue-500 to-red-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("pacers", "Indiana Pacers", "nba", "from-blue-900 via-yellow-600 to-blue-900", "from-blue-600 to-yellow-400", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("hawks", "Atlanta Hawks", "nba", "from-red-800 via-slate-800 to-red-800", "from-red-500 to-yellow-400", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("hornets", "Charlotte Hornets", "nba", "from-teal-800 via-purple-700 to-teal-800", "from-teal-500 to-purple-500", "bg-teal-600", "shadow-teal-500/30"),
  createTeamTheme("magic", "Orlando Magic", "nba", "from-blue-900 via-slate-800 to-blue-900", "from-blue-500 to-black", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("wizards", "Washington Wizards", "nba", "from-blue-900 via-red-700 to-blue-900", "from-blue-500 to-red-500", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("nuggets", "Denver Nuggets", "nba", "from-blue-800 via-yellow-600 to-blue-800", "from-blue-500 to-yellow-400", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("timberwolves", "Minnesota Timberwolves", "nba", "from-blue-900 via-green-700 to-blue-900", "from-blue-500 to-green-500", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("thunder", "Oklahoma City Thunder", "nba", "from-blue-800 via-orange-700 to-blue-800", "from-blue-500 to-orange-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("blazers", "Portland Trail Blazers", "nba", "from-red-800 via-slate-900 to-red-800", "from-red-500 to-black", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("jazz", "Utah Jazz", "nba", "from-yellow-600 via-blue-900 to-yellow-600", "from-yellow-400 to-blue-600", "bg-yellow-500", "shadow-yellow-500/30"),
  createTeamTheme("grizzlies", "Memphis Grizzlies", "nba", "from-blue-900 via-cyan-700 to-blue-900", "from-blue-600 to-cyan-500", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("pelicans", "New Orleans Pelicans", "nba", "from-blue-900 via-red-700 to-blue-900", "from-blue-600 to-red-500", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("spurs", "San Antonio Spurs", "nba", "from-slate-800 via-slate-900 to-slate-800", "from-slate-400 to-black", "bg-slate-600", "shadow-slate-500/30"),
  createTeamTheme("rockets", "Houston Rockets", "nba", "from-red-800 via-slate-900 to-red-800", "from-red-500 to-black", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("mavericks", "Dallas Mavericks", "nba", "from-blue-800 via-slate-800 to-blue-800", "from-blue-500 to-white", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("clippers", "Los Angeles Clippers", "nba", "from-blue-800 via-red-700 to-blue-800", "from-blue-500 to-red-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("kings", "Sacramento Kings", "nba", "from-purple-800 via-slate-800 to-purple-800", "from-purple-500 to-slate-400", "bg-purple-600", "shadow-purple-500/30"),
  createTeamTheme("suns", "Phoenix Suns", "nba", "from-purple-800 via-orange-700 to-purple-800", "from-purple-500 to-orange-500", "bg-purple-600", "shadow-purple-500/30"),

  // ============ NHL TEAMS (32) ============
  createTeamTheme("predators", "Nashville Predators", "nhl", "from-yellow-600 via-blue-900 to-yellow-600", "from-yellow-400 to-blue-600", "bg-yellow-500", "shadow-yellow-500/30"),
  createTeamTheme("bruins", "Boston Bruins", "nhl", "from-yellow-600 via-slate-900 to-yellow-600", "from-yellow-400 to-black", "bg-yellow-500", "shadow-yellow-500/30"),
  createTeamTheme("blackhawks", "Chicago Blackhawks", "nhl", "from-red-800 via-slate-900 to-red-800", "from-red-500 to-black", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("redwings", "Detroit Red Wings", "nhl", "from-red-800 via-slate-800 to-red-800", "from-red-500 to-white", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("penguins", "Pittsburgh Penguins", "nhl", "from-yellow-600 via-slate-900 to-yellow-600", "from-yellow-400 to-black", "bg-yellow-500", "shadow-yellow-500/30"),
  createTeamTheme("rangers-nhl", "New York Rangers", "nhl", "from-blue-800 via-red-700 to-blue-800", "from-blue-500 to-red-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("islanders", "New York Islanders", "nhl", "from-blue-800 via-orange-700 to-blue-800", "from-blue-500 to-orange-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("flyers", "Philadelphia Flyers", "nhl", "from-orange-700 via-slate-900 to-orange-700", "from-orange-500 to-black", "bg-orange-600", "shadow-orange-500/30"),
  createTeamTheme("capitals", "Washington Capitals", "nhl", "from-red-800 via-blue-900 to-red-800", "from-red-500 to-blue-600", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("hurricanes", "Carolina Hurricanes", "nhl", "from-red-800 via-slate-900 to-red-800", "from-red-500 to-black", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("lightning", "Tampa Bay Lightning", "nhl", "from-blue-800 via-slate-800 to-blue-800", "from-blue-500 to-white", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("panthers-nhl", "Florida Panthers", "nhl", "from-red-800 via-blue-900 to-red-800", "from-red-500 to-blue-600", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("maple-leafs", "Toronto Maple Leafs", "nhl", "from-blue-800 via-slate-800 to-blue-800", "from-blue-500 to-white", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("canadiens", "Montreal Canadiens", "nhl", "from-red-800 via-blue-900 to-red-800", "from-red-500 to-blue-600", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("senators", "Ottawa Senators", "nhl", "from-red-800 via-slate-900 to-red-800", "from-red-500 to-black", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("sabres", "Buffalo Sabres", "nhl", "from-blue-900 via-yellow-600 to-blue-900", "from-blue-600 to-yellow-400", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("devils", "New Jersey Devils", "nhl", "from-red-800 via-slate-900 to-red-800", "from-red-500 to-black", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("blue-jackets", "Columbus Blue Jackets", "nhl", "from-blue-900 via-red-800 to-blue-900", "from-blue-600 to-red-500", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("wild", "Minnesota Wild", "nhl", "from-green-800 via-red-700 to-green-800", "from-green-500 to-red-500", "bg-green-600", "shadow-green-500/30"),
  createTeamTheme("jets-nhl", "Winnipeg Jets", "nhl", "from-blue-900 via-slate-800 to-blue-900", "from-blue-600 to-white", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("blues", "St. Louis Blues", "nhl", "from-blue-800 via-yellow-600 to-blue-800", "from-blue-500 to-yellow-400", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("avalanche", "Colorado Avalanche", "nhl", "from-red-800 via-blue-900 to-red-800", "from-red-500 to-blue-600", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("stars", "Dallas Stars", "nhl", "from-green-800 via-slate-900 to-green-800", "from-green-500 to-black", "bg-green-600", "shadow-green-500/30"),
  createTeamTheme("coyotes", "Utah Hockey Club", "nhl", "from-blue-900 via-slate-800 to-blue-900", "from-blue-600 to-slate-400", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("golden-knights", "Vegas Golden Knights", "nhl", "from-yellow-600 via-slate-900 to-yellow-600", "from-yellow-400 to-slate-600", "bg-yellow-500", "shadow-yellow-500/30"),
  createTeamTheme("kings-nhl", "Los Angeles Kings", "nhl", "from-slate-800 via-slate-900 to-slate-800", "from-slate-400 to-black", "bg-slate-600", "shadow-slate-500/30"),
  createTeamTheme("sharks", "San Jose Sharks", "nhl", "from-teal-800 via-slate-900 to-teal-800", "from-teal-500 to-black", "bg-teal-600", "shadow-teal-500/30"),
  createTeamTheme("ducks", "Anaheim Ducks", "nhl", "from-orange-800 via-slate-900 to-orange-800", "from-orange-500 to-black", "bg-orange-600", "shadow-orange-500/30"),
  createTeamTheme("canucks", "Vancouver Canucks", "nhl", "from-blue-800 via-green-700 to-blue-800", "from-blue-500 to-green-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("flames", "Calgary Flames", "nhl", "from-red-800 via-yellow-600 to-red-800", "from-red-500 to-yellow-400", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("oilers", "Edmonton Oilers", "nhl", "from-blue-800 via-orange-700 to-blue-800", "from-blue-500 to-orange-500", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("kraken", "Seattle Kraken", "nhl", "from-teal-900 via-blue-900 to-teal-900", "from-teal-500 to-blue-500", "bg-teal-700", "shadow-teal-500/30"),

  // ============ MLS TEAMS ============
  createTeamTheme("nashville-sc", "Nashville SC", "mls", "from-yellow-600 via-blue-900 to-yellow-600", "from-yellow-400 to-blue-600", "bg-yellow-500", "shadow-yellow-500/30"),
  createTeamTheme("atlanta-united", "Atlanta United", "mls", "from-red-800 via-slate-900 to-red-800", "from-red-500 to-black", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("lafc", "Los Angeles FC", "mls", "from-slate-900 via-yellow-600 to-slate-900", "from-black to-yellow-400", "bg-yellow-500", "shadow-yellow-500/30"),
  createTeamTheme("la-galaxy", "LA Galaxy", "mls", "from-blue-900 via-yellow-600 to-blue-900", "from-blue-600 to-yellow-400", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("seattle-sounders", "Seattle Sounders", "mls", "from-green-800 via-blue-800 to-green-800", "from-green-500 to-blue-500", "bg-green-600", "shadow-green-500/30"),
  createTeamTheme("inter-miami", "Inter Miami", "mls", "from-pink-700 via-slate-900 to-pink-700", "from-pink-500 to-black", "bg-pink-600", "shadow-pink-500/30"),
  createTeamTheme("nycfc", "New York City FC", "mls", "from-sky-800 via-orange-700 to-sky-800", "from-sky-500 to-orange-500", "bg-sky-600", "shadow-sky-500/30"),
  createTeamTheme("red-bulls", "New York Red Bulls", "mls", "from-red-800 via-yellow-600 to-red-800", "from-red-500 to-yellow-400", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("portland-timbers", "Portland Timbers", "mls", "from-green-800 via-yellow-600 to-green-800", "from-green-500 to-yellow-400", "bg-green-600", "shadow-green-500/30"),
  createTeamTheme("columbus-crew", "Columbus Crew", "mls", "from-yellow-600 via-slate-900 to-yellow-600", "from-yellow-400 to-black", "bg-yellow-500", "shadow-yellow-500/30"),

  // ============ EPL TEAMS ============
  createTeamTheme("arsenal", "Arsenal", "epl", "from-red-800 via-slate-800 to-red-800", "from-red-500 to-white", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("chelsea", "Chelsea", "epl", "from-blue-800 via-slate-800 to-blue-800", "from-blue-500 to-white", "bg-blue-600", "shadow-blue-500/30"),
  createTeamTheme("liverpool", "Liverpool", "epl", "from-red-800 via-slate-800 to-red-800", "from-red-500 to-white", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("man-city", "Manchester City", "epl", "from-sky-700 via-slate-800 to-sky-700", "from-sky-500 to-white", "bg-sky-600", "shadow-sky-500/30"),
  createTeamTheme("man-united", "Manchester United", "epl", "from-red-800 via-slate-900 to-red-800", "from-red-500 to-yellow-400", "bg-red-600", "shadow-red-500/30"),
  createTeamTheme("tottenham", "Tottenham Hotspur", "epl", "from-blue-950 via-slate-800 to-blue-950", "from-blue-600 to-white", "bg-blue-700", "shadow-blue-500/30"),
  createTeamTheme("newcastle", "Newcastle United", "epl", "from-slate-900 via-slate-800 to-slate-900", "from-slate-400 to-white", "bg-slate-600", "shadow-slate-500/30"),
  createTeamTheme("aston-villa", "Aston Villa", "epl", "from-purple-900 via-sky-700 to-purple-900", "from-purple-500 to-sky-400", "bg-purple-600", "shadow-purple-500/30"),
  createTeamTheme("west-ham", "West Ham United", "epl", "from-red-900 via-sky-800 to-red-900", "from-red-600 to-sky-500", "bg-red-700", "shadow-red-500/30"),
  createTeamTheme("brighton", "Brighton & Hove Albion", "epl", "from-blue-800 via-slate-800 to-blue-800", "from-blue-500 to-white", "bg-blue-600", "shadow-blue-500/30"),

  // ============ GOLF THEMES ============
  createTheme(
    "augusta", "Augusta National", "golf",
    "from-green-900 via-emerald-800 to-green-900",
    "from-green-500 to-yellow-500",
    "bg-green-600", "bg-green-950", "bg-emerald-900/80",
    "text-white", "text-green-200", "border-green-500/30", "shadow-green-500/20"
  ),
  createTheme(
    "links-course", "Links Course", "golf",
    "from-amber-900 via-green-800 to-amber-900",
    "from-amber-500 to-green-500",
    "bg-amber-600", "bg-amber-950", "bg-green-900/80",
    "text-white", "text-amber-200", "border-amber-500/30", "shadow-amber-500/20"
  ),
  createTheme(
    "fairway-green", "Fairway Green", "golf",
    "from-green-800 via-lime-700 to-green-800",
    "from-green-500 to-lime-400",
    "bg-green-500", "bg-green-950", "bg-lime-900/80",
    "text-white", "text-lime-200", "border-green-500/30", "shadow-green-500/20"
  ),
  createTheme(
    "country-club", "Country Club", "golf",
    "from-blue-950 via-green-900 to-blue-950",
    "from-blue-500 to-green-500",
    "bg-blue-600", "bg-blue-950", "bg-green-900/80",
    "text-white", "text-blue-200", "border-blue-500/30", "shadow-blue-500/20"
  ),

  // ============ TENNIS THEMES ============
  createTheme(
    "wimbledon", "Wimbledon", "tennis",
    "from-green-800 via-purple-900 to-green-800",
    "from-green-500 to-purple-500",
    "bg-green-600", "bg-green-950", "bg-purple-900/80",
    "text-white", "text-green-200", "border-green-500/30", "shadow-green-500/20"
  ),
  createTheme(
    "us-open", "US Open", "tennis",
    "from-blue-800 via-slate-800 to-blue-800",
    "from-blue-500 to-yellow-400",
    "bg-blue-600", "bg-blue-950", "bg-slate-900/80",
    "text-white", "text-blue-200", "border-blue-500/30", "shadow-blue-500/20"
  ),
  createTheme(
    "clay-court", "Clay Court", "tennis",
    "from-orange-800 via-red-700 to-orange-800",
    "from-orange-500 to-red-500",
    "bg-orange-600", "bg-orange-950", "bg-red-900/80",
    "text-white", "text-orange-200", "border-orange-500/30", "shadow-orange-500/20"
  ),
  createTheme(
    "australian-open", "Australian Open", "tennis",
    "from-blue-700 via-cyan-700 to-blue-700",
    "from-blue-500 to-cyan-400",
    "bg-blue-500", "bg-blue-950", "bg-cyan-900/80",
    "text-white", "text-blue-200", "border-blue-500/30", "shadow-blue-500/20"
  ),

  // ============ NATURE THEMES ============
  createTheme(
    "ocean-blue", "Ocean Blue", "nature",
    "from-blue-900 via-cyan-800 to-blue-900",
    "from-blue-500 to-cyan-400",
    "bg-cyan-500", "bg-blue-950", "bg-cyan-900/80",
    "text-white", "text-cyan-200", "border-cyan-500/30", "shadow-cyan-500/20"
  ),
  createTheme(
    "forest", "Forest", "nature",
    "from-green-950 via-emerald-900 to-green-950",
    "from-green-500 to-emerald-400",
    "bg-green-500", "bg-green-950", "bg-emerald-900/80",
    "text-white", "text-green-200", "border-green-500/30", "shadow-green-500/20"
  ),
  createTheme(
    "sunset", "Sunset", "nature",
    "from-orange-900 via-pink-800 to-purple-900",
    "from-orange-500 to-pink-500",
    "bg-orange-500", "bg-slate-950", "bg-pink-900/80",
    "text-white", "text-orange-200", "border-orange-500/30", "shadow-orange-500/20"
  ),
  createTheme(
    "desert", "Desert", "nature",
    "from-amber-900 via-orange-800 to-amber-900",
    "from-amber-500 to-orange-400",
    "bg-amber-500", "bg-amber-950", "bg-orange-900/80",
    "text-white", "text-amber-200", "border-amber-500/30", "shadow-amber-500/20"
  ),
  createTheme(
    "mountain", "Mountain", "nature",
    "from-slate-800 via-blue-900 to-slate-800",
    "from-slate-500 to-blue-500",
    "bg-slate-500", "bg-slate-950", "bg-blue-900/80",
    "text-white", "text-slate-300", "border-slate-500/30", "shadow-slate-500/20"
  ),
  createTheme(
    "cherry-blossom", "Cherry Blossom", "nature",
    "from-pink-900 via-rose-800 to-pink-900",
    "from-pink-500 to-rose-400",
    "bg-pink-500", "bg-pink-950", "bg-rose-900/80",
    "text-white", "text-pink-200", "border-pink-500/30", "shadow-pink-500/20"
  ),
  createTheme(
    "tropical", "Tropical", "nature",
    "from-teal-900 via-green-800 to-teal-900",
    "from-teal-500 to-lime-400",
    "bg-teal-500", "bg-teal-950", "bg-green-900/80",
    "text-white", "text-teal-200", "border-teal-500/30", "shadow-teal-500/20"
  ),
  createTheme(
    "aurora", "Aurora Borealis", "nature",
    "from-purple-900 via-green-800 to-blue-900",
    "from-purple-500 to-green-400",
    "bg-green-500", "bg-slate-950", "bg-purple-900/80",
    "text-white", "text-green-200", "border-green-500/30", "shadow-green-500/20"
  ),

  // ============ SPACE THEMES ============
  createTheme(
    "galaxy", "Galaxy", "space",
    "from-purple-950 via-blue-950 to-purple-950",
    "from-purple-500 to-pink-500",
    "bg-purple-500", "bg-slate-950", "bg-purple-950/80",
    "text-white", "text-purple-200", "border-purple-500/30", "shadow-purple-500/20"
  ),
  createTheme(
    "nebula", "Nebula", "space",
    "from-pink-900 via-purple-900 to-blue-900",
    "from-pink-500 to-purple-500",
    "bg-pink-500", "bg-slate-950", "bg-purple-900/80",
    "text-white", "text-pink-200", "border-pink-500/30", "shadow-pink-500/20"
  ),
  createTheme(
    "starfield", "Starfield", "space",
    "from-slate-950 via-blue-950 to-slate-950",
    "from-blue-400 to-white",
    "bg-blue-400", "bg-black", "bg-slate-950/80",
    "text-white", "text-blue-200", "border-blue-500/30", "shadow-blue-500/20"
  ),
  createTheme(
    "mars", "Mars", "space",
    "from-red-950 via-orange-900 to-red-950",
    "from-red-500 to-orange-500",
    "bg-red-500", "bg-red-950", "bg-orange-900/80",
    "text-white", "text-red-200", "border-red-500/30", "shadow-red-500/20"
  ),

  // ============ SOLID COLOR THEMES ============
  createTheme(
    "solid-red", "Solid Red", "solid",
    "from-red-900 via-red-800 to-red-900",
    "from-red-500 to-rose-500",
    "bg-red-500", "bg-red-950", "bg-red-900/80",
    "text-white", "text-red-200", "border-red-500/30", "shadow-red-500/20"
  ),
  createTheme(
    "solid-blue", "Solid Blue", "solid",
    "from-blue-900 via-blue-800 to-blue-900",
    "from-blue-500 to-indigo-500",
    "bg-blue-500", "bg-blue-950", "bg-blue-900/80",
    "text-white", "text-blue-200", "border-blue-500/30", "shadow-blue-500/20"
  ),
  createTheme(
    "solid-green", "Solid Green", "solid",
    "from-green-900 via-green-800 to-green-900",
    "from-green-500 to-emerald-500",
    "bg-green-500", "bg-green-950", "bg-green-900/80",
    "text-white", "text-green-200", "border-green-500/30", "shadow-green-500/20"
  ),
  createTheme(
    "solid-purple", "Solid Purple", "solid",
    "from-purple-900 via-purple-800 to-purple-900",
    "from-purple-500 to-violet-500",
    "bg-purple-500", "bg-purple-950", "bg-purple-900/80",
    "text-white", "text-purple-200", "border-purple-500/30", "shadow-purple-500/20"
  ),
  createTheme(
    "solid-orange", "Solid Orange", "solid",
    "from-orange-900 via-orange-800 to-orange-900",
    "from-orange-500 to-amber-500",
    "bg-orange-500", "bg-orange-950", "bg-orange-900/80",
    "text-white", "text-orange-200", "border-orange-500/30", "shadow-orange-500/20"
  ),
  createTheme(
    "solid-pink", "Solid Pink", "solid",
    "from-pink-900 via-pink-800 to-pink-900",
    "from-pink-500 to-rose-500",
    "bg-pink-500", "bg-pink-950", "bg-pink-900/80",
    "text-white", "text-pink-200", "border-pink-500/30", "shadow-pink-500/20"
  ),
  createTheme(
    "solid-teal", "Solid Teal", "solid",
    "from-teal-900 via-teal-800 to-teal-900",
    "from-teal-500 to-cyan-500",
    "bg-teal-500", "bg-teal-950", "bg-teal-900/80",
    "text-white", "text-teal-200", "border-teal-500/30", "shadow-teal-500/20"
  ),
  createTheme(
    "solid-yellow", "Solid Yellow", "solid",
    "from-yellow-800 via-yellow-700 to-yellow-800",
    "from-yellow-500 to-amber-500",
    "bg-yellow-500", "bg-yellow-950", "bg-yellow-900/80",
    "text-slate-900", "text-yellow-900", "border-yellow-500/30", "shadow-yellow-500/20"
  ),

  // ============ PASTEL THEMES ============
  createTheme(
    "pastel-pink", "Pastel Pink", "pastel",
    "from-pink-200 via-rose-100 to-pink-200",
    "from-pink-400 to-rose-400",
    "bg-pink-400", "bg-pink-50", "bg-white",
    "text-pink-900", "text-pink-700", "border-pink-300", "shadow-pink-300/20"
  ),
  createTheme(
    "pastel-blue", "Pastel Blue", "pastel",
    "from-blue-200 via-sky-100 to-blue-200",
    "from-blue-400 to-sky-400",
    "bg-blue-400", "bg-blue-50", "bg-white",
    "text-blue-900", "text-blue-700", "border-blue-300", "shadow-blue-300/20"
  ),
  createTheme(
    "pastel-green", "Pastel Green", "pastel",
    "from-green-200 via-emerald-100 to-green-200",
    "from-green-400 to-emerald-400",
    "bg-green-400", "bg-green-50", "bg-white",
    "text-green-900", "text-green-700", "border-green-300", "shadow-green-300/20"
  ),
  createTheme(
    "pastel-purple", "Pastel Purple", "pastel",
    "from-purple-200 via-violet-100 to-purple-200",
    "from-purple-400 to-violet-400",
    "bg-purple-400", "bg-purple-50", "bg-white",
    "text-purple-900", "text-purple-700", "border-purple-300", "shadow-purple-300/20"
  ),
  createTheme(
    "pastel-yellow", "Pastel Yellow", "pastel",
    "from-yellow-200 via-amber-100 to-yellow-200",
    "from-yellow-400 to-amber-400",
    "bg-yellow-400", "bg-yellow-50", "bg-white",
    "text-yellow-900", "text-yellow-700", "border-yellow-300", "shadow-yellow-300/20"
  ),
  createTheme(
    "pastel-mint", "Pastel Mint", "pastel",
    "from-teal-200 via-emerald-100 to-teal-200",
    "from-teal-400 to-emerald-400",
    "bg-teal-400", "bg-teal-50", "bg-white",
    "text-teal-900", "text-teal-700", "border-teal-300", "shadow-teal-300/20"
  ),
  createTheme(
    "pastel-peach", "Pastel Peach", "pastel",
    "from-orange-200 via-rose-100 to-orange-200",
    "from-orange-400 to-rose-400",
    "bg-orange-400", "bg-orange-50", "bg-white",
    "text-orange-900", "text-orange-700", "border-orange-300", "shadow-orange-300/20"
  ),
  createTheme(
    "pastel-lavender", "Pastel Lavender", "pastel",
    "from-violet-200 via-purple-100 to-violet-200",
    "from-violet-400 to-purple-400",
    "bg-violet-400", "bg-violet-50", "bg-white",
    "text-violet-900", "text-violet-700", "border-violet-300", "shadow-violet-300/20"
  ),

  // ============ PATTERN THEMES ============
  createTheme(
    "paisley-blue", "Paisley Blue", "pattern",
    "from-blue-900 via-indigo-800 to-blue-900",
    "from-blue-500 to-indigo-500",
    "bg-blue-500", "bg-blue-950", "bg-indigo-900/80",
    "text-white", "text-blue-200", "border-blue-500/30", "shadow-blue-500/20"
  ),
  createTheme(
    "floral-rose", "Floral Rose", "pattern",
    "from-rose-900 via-pink-800 to-rose-900",
    "from-rose-500 to-pink-500",
    "bg-rose-500", "bg-rose-950", "bg-pink-900/80",
    "text-white", "text-rose-200", "border-rose-500/30", "shadow-rose-500/20"
  ),
  createTheme(
    "geometric", "Geometric", "pattern",
    "from-slate-900 via-cyan-900 to-slate-900",
    "from-slate-500 to-cyan-500",
    "bg-cyan-500", "bg-slate-950", "bg-cyan-900/80",
    "text-white", "text-slate-300", "border-cyan-500/30", "shadow-cyan-500/20"
  ),
  createTheme(
    "art-deco", "Art Deco", "pattern",
    "from-yellow-800 via-slate-900 to-yellow-800",
    "from-yellow-500 to-slate-500",
    "bg-yellow-500", "bg-slate-950", "bg-yellow-900/80",
    "text-white", "text-yellow-200", "border-yellow-500/30", "shadow-yellow-500/20"
  ),
  createTheme(
    "tribal", "Tribal", "pattern",
    "from-amber-900 via-red-900 to-amber-900",
    "from-amber-500 to-red-500",
    "bg-amber-500", "bg-amber-950", "bg-red-900/80",
    "text-white", "text-amber-200", "border-amber-500/30", "shadow-amber-500/20"
  ),

  // ============ PARTNER PLACEHOLDER ============
  createTheme(
    "partner-template", "Partner Brand", "partner",
    "from-slate-900 via-slate-800 to-slate-900",
    "from-slate-500 to-slate-600",
    "bg-slate-500", "bg-slate-950", "bg-slate-900/80",
    "text-white", "text-slate-300", "border-slate-500/30", "shadow-slate-500/20"
  ),
];

export const FREE_THEME_IDS = [
  "orby-aqua",
  "light-mode", 
  "dark-mode",
  "pure-black",
  "ocean-blue"
];

export const THEME_CATEGORIES = [
  { id: "classic", label: "Classic", icon: "Palette", color: "from-slate-600 to-slate-800" },
  { id: "nfl", label: "NFL", icon: "Football", color: "from-green-600 to-green-800" },
  { id: "mlb", label: "MLB", icon: "Circle", color: "from-red-600 to-red-800" },
  { id: "nba", label: "NBA", icon: "Circle", color: "from-orange-600 to-orange-800" },
  { id: "nhl", label: "NHL", icon: "Snowflake", color: "from-blue-600 to-blue-800" },
  { id: "mls", label: "MLS", icon: "Circle", color: "from-emerald-600 to-emerald-800" },
  { id: "epl", label: "Premier League", icon: "Crown", color: "from-purple-600 to-purple-800" },
  { id: "golf", label: "Golf", icon: "Flag", color: "from-green-600 to-green-800" },
  { id: "tennis", label: "Tennis", icon: "Circle", color: "from-lime-600 to-lime-800" },
  { id: "nature", label: "Nature", icon: "Trees", color: "from-teal-600 to-teal-800" },
  { id: "space", label: "Space", icon: "Star", color: "from-purple-600 to-indigo-800" },
  { id: "solid", label: "Solid Colors", icon: "Square", color: "from-rose-600 to-rose-800" },
  { id: "pastel", label: "Pastels", icon: "Sparkles", color: "from-pink-400 to-purple-400" },
  { id: "pattern", label: "Patterns", icon: "Shapes", color: "from-amber-600 to-amber-800" },
  { id: "partner", label: "Partner Brands", icon: "Building", color: "from-cyan-600 to-cyan-800" },
] as const;

export const categoryOrder = [
  "classic", "nfl", "mlb", "nba", "nhl", "mls", "epl",
  "golf", "tennis", "nature", "space", "solid", "pastel", "pattern", "partner"
];
