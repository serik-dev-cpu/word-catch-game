export function uid() {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Draws items one at a time from `items`, cycling through a freshly
// shuffled copy each time it runs out, so every item appears once
// before any repeats (and consecutive draws never repeat the same item
// when there's more than one item, since a reshuffle happens between).
export function createShuffleBag(items) {
  let bag = shuffle(items);
  let lastItem = null;

  return {
    next() {
      if (bag.length === 0) {
        bag = shuffle(items);
        if (bag.length > 1 && bag[0] === lastItem) {
          [bag[0], bag[1]] = [bag[1], bag[0]];
        }
      }
      const item = bag.pop();
      lastItem = item;
      return item;
    },
    refill(newItems) {
      items = newItems;
      bag = shuffle(items);
      lastItem = null;
    }
  };
}
