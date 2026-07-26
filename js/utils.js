export function uid() {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Draws items at random, biased by `getWeight` — higher weight means the item
// comes up more often. `getWeight` is re-evaluated on every draw, so callers can
// mutate an item's mastery in place and have the next draw reflect it. The item
// drawn last is excluded from the next draw so the same one never repeats twice
// in a row (unless it's the only one left).
export function createWeightedPicker(items, getWeight = () => 1) {
  let pool = items;
  let lastItem = null;

  return {
    next() {
      if (pool.length === 0) return null;
      if (pool.length === 1) {
        lastItem = pool[0];
        return pool[0];
      }

      const candidates = pool.filter((item) => item !== lastItem);
      let total = 0;
      const weights = candidates.map((item) => {
        const w = Math.max(0.0001, getWeight(item));
        total += w;
        return w;
      });

      let roll = Math.random() * total;
      let chosen = candidates[candidates.length - 1];
      for (let i = 0; i < candidates.length; i++) {
        roll -= weights[i];
        if (roll <= 0) {
          chosen = candidates[i];
          break;
        }
      }

      lastItem = chosen;
      return chosen;
    },
    refill(newItems) {
      pool = newItems;
      lastItem = null;
    }
  };
}
