import { SEED_PAIRS, SEED_LANGS, buildSeedList, seedPairIndexFromId } from "./data/seedWords.js";
import { uid, clamp } from "./utils.js";

const STORAGE_KEY = "vocabgame:v1";
const LANGS = SEED_LANGS;
const DEFAULT_NATIVE_LANGUAGE = "ru";

// Leitner-style mastery ladder: a word climbs a level each time it's spelled
// without mistakes and drops one whenever it isn't, so the words you keep
// getting wrong stay in heavy rotation and mastered ones fade to the back.
const MAX_SRS_LEVEL = 5;

const DEFAULT_DAILY_GOAL = 10;

// Local calendar day, not UTC — the streak should roll over at the player's
// midnight, not somewhere in the middle of their evening.
function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

function defaultData() {
  return {
    version: 1,
    languages: { ru: { words: [] }, en: { words: [] }, uz: { words: [] } },
    settings: {
      activeLanguage: "ru",
      nativeLanguage: DEFAULT_NATIVE_LANGUAGE,
      soundEnabled: true,
      dailyGoal: DEFAULT_DAILY_GOAL
    },
    progress: { date: dayKey(), wordsToday: 0, streak: 0, bestStreak: 0, lastGoalDate: null }
  };
}

// Which language a hint is written in. Falls back when the player is studying
// their own native language, since a word can't hint at itself.
function hintLangFor(data, studyLang) {
  const native = (data.settings && data.settings.nativeLanguage) || DEFAULT_NATIVE_LANGUAGE;
  if (native !== studyLang) return native;
  return studyLang === "en" ? "ru" : "en";
}

// Backfills the daily-goal fields for saves written before streaks existed.
function ensureProgress(data) {
  if (!data.settings) data.settings = {};
  if (typeof data.settings.dailyGoal !== "number") {
    data.settings.dailyGoal = DEFAULT_DAILY_GOAL;
  }
  if (!LANGS.includes(data.settings.nativeLanguage)) {
    data.settings.nativeLanguage = DEFAULT_NATIVE_LANGUAGE;
  }
  if (!data.progress) {
    data.progress = { date: dayKey(), wordsToday: 0, streak: 0, bestStreak: 0, lastGoalDate: null };
  }
  return data;
}

function ensureSeeded(data) {
  for (const lang of LANGS) {
    if (!data.languages[lang]) data.languages[lang] = { words: [] };
    if (!data.languages[lang].words || data.languages[lang].words.length === 0) {
      data.languages[lang].words = buildSeedList(lang, hintLangFor(data, lang)).map((w) => ({
        ...w,
        createdAt: Date.now(),
        stats: { timesPlayed: 0, timesWon: 0 }
      }));
    }
  }
  return data;
}

// Built-in entries are re-derived from the concept table on every load, so
// changing the native language re-labels the whole starter set while each
// word's id — and therefore its mastery level — stays put.
function refreshBuiltInWords(data) {
  for (const lang of LANGS) {
    const hintLang = hintLangFor(data, lang);
    for (const word of data.languages[lang].words) {
      if (!word.isBuiltIn) continue;
      const pair = SEED_PAIRS[seedPairIndexFromId(word.id)];
      if (!pair) continue;
      word.word = pair[lang];
      word.hint = pair[hintLang];
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
  data = ensureProgress(data);
  data = ensureSeeded(data);
  data = refreshBuiltInWords(data);
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

export function getNativeLanguage() {
  return state.settings.nativeLanguage;
}

export function setNativeLanguage(lang) {
  if (!LANGS.includes(lang)) return;
  state.settings.nativeLanguage = lang;
  refreshBuiltInWords(state);
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

function rollOverDay() {
  const today = dayKey();
  if (state.progress.date !== today) {
    state.progress.date = today;
    state.progress.wordsToday = 0;
  }
}

export function getDailyGoal() {
  return state.settings.dailyGoal;
}

export function getProgress() {
  rollOverDay();
  const { wordsToday, streak, bestStreak, lastGoalDate } = state.progress;
  const goal = state.settings.dailyGoal;
  // A streak only counts while it's still alive: hitting the goal today, or
  // yesterday with today still open. Any older and it has already lapsed.
  const alive = lastGoalDate === dayKey() || lastGoalDate === yesterdayKey();
  return {
    wordsToday,
    goal,
    goalMet: wordsToday >= goal,
    streak: alive ? streak : 0,
    bestStreak
  };
}

// Called once per word solved. Returns true if this word is the one that
// completed today's goal, so the caller can celebrate it.
export function recordWordCompleted() {
  rollOverDay();
  const p = state.progress;
  p.wordsToday += 1;

  const justMetGoal = p.wordsToday === state.settings.dailyGoal;
  if (justMetGoal) {
    const today = dayKey();
    if (p.lastGoalDate !== today) {
      p.streak = p.lastGoalDate === yesterdayKey() ? p.streak + 1 : 1;
      p.lastGoalDate = today;
      p.bestStreak = Math.max(p.bestStreak, p.streak);
    }
  }

  save(state);
  return justMetGoal;
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
