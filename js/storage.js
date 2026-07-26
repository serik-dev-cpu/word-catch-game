import { seedWords } from "./data/seedWords.js";
import { uid } from "./utils.js";

const STORAGE_KEY = "vocabgame:v1";
const LANGS = ["ru", "en"];

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

export function recordWordPlayed(lang, id, won) {
  const list = state.languages[lang].words;
  const w = list.find((w) => w.id === id);
  if (!w) return;
  w.stats.timesPlayed += 1;
  if (won) w.stats.timesWon += 1;
  save(state);
}
