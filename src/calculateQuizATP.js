export function calculateQuizATP({ speed, accuracy }) {
  const accuracyBase = {
    perfect: 8,
    good: 6,
    ok: 4,
    bad: 2
  };

  const speedModifier = {
    very_fast: 2,
    fast: 1,
    normal: 0,
    slow: -1,
    very_slow: -2
  };

  const base = accuracyBase[accuracy] ?? 0;
  const mod = speedModifier[speed] ?? 0;

  return Math.min(10, Math.max(1, base + mod));
}

