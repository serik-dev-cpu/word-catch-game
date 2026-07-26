import { seedWords } from "./data/seedWords.js";
import { uid, clamp } from "./utils.js";

const STORAGE_KEY = "vocabgame:v1";
const LANGS = ["ru", "en"];

// Leitner-style mastery ladder: a word climbs a level each time it's spelled
// without mistakes and drops one whenever it isn't, so the words you keep
// getting wrong stay in heavy rotation and mastered ones fade to the back.
const MAX_SRS_LEVEL = 5;

function defaultData() {
  return {
    version: 1,
    languages: { ru: { words: [] }, en: { words: [] } },
    settings: { activeLanguage: "ru", soundEnabled: true }
  };
}

function ensureSeeded(data) {
  for (const lang of LANGS) {
    if (!data.languages[lang]) data.languages[lang] = { words: [] };
    if (!data.languages[lang].words || data.languages[lang].words.length === 0) {
      data.languages[lang].words = seedWords[lang].map((w) => ({
        ...w,
        createdAt: Date.now(),
        stats: { timesPlayed: 0, timesWon: 0 }
      }));
    }
  }
  return data;
}

function load() {
  let data;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    data = raw ? JSON.parse(raw) : defaultData();
  } catch {
    data = defaultData();
  }
  data = ensureSeeded(data);
  save(data);
  return data;
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let state = load();

export function getActiveLanguage() {
  return state.settings.activeLanguage;
}

export function setActiveLanguage(lang) {
  state.settings.activeLanguage = lang;
  save(state);
}

export function getSoundEnabled() {
  return state.settings.soundEnabled !== false;
}

export function setSoundEnabled(enabled) {
  state.settings.soundEnabled = enabled;
  save(state);
}

export function getWords(lang) {
  return state.languages[lang].words;
}

export function addWord(lang, word, hint) {
  const entry = {
    id: uid(),
    word: word.trim(),
    hint: hint.trim(),
    isBuiltIn: false,
    createdAt: Date.now(),
    stats: { timesPlayed: 0, timesWon: 0 }
  };
  state.languages[lang].words.push(entry);
  save(state);
  return entry;
}

export function updateWord(lang, id, patch) {
  const list = state.languages[lang].words;
  const idx = list.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  save(state);
  return list[idx];
}

export function deleteWord(lang, id) {
  const list = state.languages[lang].words;
  const idx = list.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  save(state);
  return true;
}

export function getWordLevel(word) {
  const level = word.stats && word.stats.level;
  return typeof level === "number" ? clamp(level, 0, MAX_SRS_LEVEL) : 0;
}

// Weight halves with every level gained, so a brand-new word is drawn 32x as
// often as a fully mastered one.
export function getWordWeight(word) {
  return 2 ** (MAX_SRS_LEVEL - getWordLevel(word));
}

export function recordWordResult(lang, id, { won, flawless }) {
  const list = state.languages[lang].words;
  const w = list.find((w) => w.id === id);
  if (!w) return;
  if (!w.stats) w.stats = { timesPlayed: 0, timesWon: 0 };

  w.stats.timesPlayed += 1;
  if (won) w.stats.timesWon += 1;

  const level = getWordLevel(w);
  w.stats.level = won && flawless
    ? Math.min(MAX_SRS_LEVEL, level + 1)
    : Math.max(0, level - 1);
  w.stats.lastSeenAt = Date.now();

  save(state);
}
