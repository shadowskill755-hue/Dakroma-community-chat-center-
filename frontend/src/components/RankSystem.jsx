// ============================================================
// RankSystem - Free Fire style ranks
// ============================================================

export const RANKS = [
  { name: "Bronze",       minXP: 0,     icon: "🥉", color: "#cd7f32", tier: 1 },
  { name: "Silver",       minXP: 500,   icon: "🥈", color: "#c0c0c0", tier: 2 },
  { name: "Gold",         minXP: 1500,  icon: "🥇", color: "#ffd700", tier: 3 },
  { name: "Platinum",     minXP: 3000,  icon: "💎", color: "#00f5ff", tier: 4 },
  { name: "Diamond",      minXP: 6000,  icon: "💠", color: "#b9f2ff", tier: 5 },
  { name: "Master",       minXP: 10000, icon: "👑", color: "#ff006e", tier: 6 },
  { name: "Grand Master", minXP: 20000, icon: "⚡", color: "#7c3aed", tier: 7 },
];

export const getRank = (xp = 0) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return RANKS[i];
  }
  return RANKS[0];
};

export const getNextRank = (xp = 0) => {
  const current = getRank(xp);
  const next = RANKS.find((r) => r.minXP > xp);
  return next || null;
};

export const getXPProgress = (xp = 0) => {
  const current = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return 100;
  const range = next.minXP - current.minXP;
  const progress = xp - current.minXP;
  return Math.floor((progress / range) * 100);
};

export const RankBadge = ({ xp = 0, size = "sm" }) => {
  const rank = getRank(xp);
  const sizes = { sm: "text-xs px-2 py-0.5", md: "text-sm px-3 py-1", lg: "text-base px-4 py-1.5" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-cyber ${sizes[size]}`}
      style={{ borderColor: rank.color + "66", backgroundColor: rank.color + "22", color: rank.color }}>
      {rank.icon} {rank.name}
    </span>
  );
};

export const XPBar = ({ xp = 0 }) => {
  const rank = getRank(xp);
  const next = getNextRank(xp);
  const progress = getXPProgress(xp);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-mono mb-1" style={{ color: rank.color }}>
        <span>{rank.icon} {rank.name}</span>
        {next && <span>{xp}/{next.minXP} XP</span>}
      </div>
      <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: rank.color }} />
      </div>
    </div>
  );
};

export default { getRank, getNextRank, getXPProgress, RankBadge, XPBar };
