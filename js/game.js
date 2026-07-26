import { clamp, createShuffleBag } from "./utils.js";

const LANE_COUNT = 5;
const CATCH_LINE_Y = 0.86;
const CATCH_WINDOW = 0.08;
const BASKET_HALF_WIDTH = 0.14;
const START_LIVES = 3;
const MAX_GAP_FORCE = 4;

function laneX(lane) {
  return (lane + 0.5) / LANE_COUNT;
}

function difficultyForRound(round) {
  return {
    spawnIntervalMs: Math.max(450, 1000 - (round - 1) * 50),
    fallDurationS: Math.max(1.6, 3.2 - (round - 1) * 0.15),
    neededProbability: Math.max(0.15, 0.35 - (round - 1) * 0.02)
  };
}

// words: array of {id, word, hint}. alphabet: string of possible decoy letters
// (should be derived from the active language's word pool by the caller).
export function createGame(words, alphabet, callbacks = {}) {
  const { onCatch, onRoundComplete, onGameOver } = callbacks;
  const bag = createShuffleBag(words);

  const state = {
    round: 0,
    lives: START_LIVES,
    score: 0,
    wordsCompleted: 0,
    currentWord: null,
    targetLetters: [],
    progressIndex: 0,
    tiles: [],
    basketX: 0.5,
    over: false
  };

  let spawnTimerMs = 0;
  let spawnsSinceNeeded = 0;
  let tileSeq = 0;
  let diff = difficultyForRound(1);

  function pickDecoyChar(needed) {
    if (!alphabet || alphabet.length === 0) return needed;
    const c = alphabet[Math.floor(Math.random() * alphabet.length)];
    return c;
  }

  function neededChar() {
    return state.targetLetters[state.progressIndex];
  }

  function startWord(wordEntry) {
    state.currentWord = wordEntry;
    state.targetLetters = wordEntry.word.toLowerCase().split("");
    state.progressIndex = 0;
    state.tiles = [];
    spawnTimerMs = 0;
    spawnsSinceNeeded = 0;
    diff = difficultyForRound(state.round);
  }

  function start() {
    state.round = 1;
    state.lives = START_LIVES;
    state.score = 0;
    state.wordsCompleted = 0;
    state.over = false;
    startWord(bag.next());
  }

  function spawnTile() {
    const needed = neededChar();
    const forced = spawnsSinceNeeded >= MAX_GAP_FORCE;
    const useNeeded = forced || Math.random() < diff.neededProbability;
    const char = useNeeded ? needed : pickDecoyChar(needed);

    if (char === needed) spawnsSinceNeeded = 0;
    else spawnsSinceNeeded += 1;

    const lane = Math.floor(Math.random() * LANE_COUNT);
    state.tiles.push({
      id: `t${++tileSeq}`,
      char,
      lane,
      x: laneX(lane),
      y: 0,
      resolved: false
    });
  }

  function resolveCatch(tile) {
    tile.resolved = true;
    const needed = neededChar();
    const isCorrect = tile.char === needed;

    if (isCorrect) {
      state.progressIndex += 1;
      state.score += 10;
      spawnsSinceNeeded = 0;
      onCatch && onCatch({ correct: true, tile });

      if (state.progressIndex >= state.targetLetters.length) {
        const bonus = 50 + state.currentWord.word.length * 5;
        state.score += bonus;
        state.wordsCompleted += 1;
        const finishedWord = state.currentWord;
        onRoundComplete && onRoundComplete({ word: finishedWord, score: state.score });
        state.round += 1;
        startWord(bag.next());
      }
    } else {
      state.lives -= 1;
      onCatch && onCatch({ correct: false, tile });
      if (state.lives <= 0) {
        state.over = true;
        onGameOver && onGameOver({ score: state.score, wordsCompleted: state.wordsCompleted });
      }
    }
  }

  function update(dtMs) {
    if (state.over) return;
    const dtS = dtMs / 1000;

    spawnTimerMs += dtMs;
    if (spawnTimerMs >= diff.spawnIntervalMs) {
      spawnTimerMs = 0;
      spawnTile();
    }

    const speed = CATCH_LINE_Y / diff.fallDurationS;
    for (const tile of state.tiles) {
      if (tile.resolved) continue;
      tile.y += speed * dtS;

      const inCatchWindow = tile.y >= CATCH_LINE_Y && tile.y <= CATCH_LINE_Y + CATCH_WINDOW;
      if (inCatchWindow) {
        const overlaps = Math.abs(tile.x - state.basketX) <= BASKET_HALF_WIDTH;
        if (overlaps) {
          resolveCatch(tile);
          if (state.over) break;
        }
      } else if (tile.y > 1) {
        tile.resolved = true; // missed past the basket, no penalty
      }
    }

    state.tiles = state.tiles.filter((t) => !t.resolved);
  }

  function setBasketX(x) {
    state.basketX = clamp(x, BASKET_HALF_WIDTH, 1 - BASKET_HALF_WIDTH);
  }

  function moveBasketBy(deltaFraction) {
    setBasketX(state.basketX + deltaFraction);
  }

  return { state, start, update, setBasketX, moveBasketBy };
}
