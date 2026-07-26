import {
  getActiveLanguage,
  getWords,
  recordWordResult,
  getWordWeight,
  recordWordCompleted,
  getProgress
} from "./storage.js";
import { createGame } from "./game.js";
import { showScreen } from "./router.js";
import { playCatchCorrect, playCatchWrong, playWordComplete, playGameOver, unlockAudio } from "./sound.js";

const fieldEl = document.getElementById("game-field");
const basketEl = document.getElementById("basket");
const hintEl = document.getElementById("hud-hint");
const livesEl = document.getElementById("hud-lives");
const scoreEl = document.getElementById("hud-score");
const progressEl = document.getElementById("game-progress");
const overlayEl = document.getElementById("round-overlay");
const overlayTextEl = document.getElementById("round-overlay-text");
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");

const BUTTON_MOVE_SPEED = 1.1; // fraction of field width per second

const tileEls = new Map();
const protectedIds = new Set();

let game = null;
let rafId = null;
let lastTs = 0;
let holdDir = 0;
let currentLang = "ru";
let overlayTimer = null;

let lastLives = null;
let lastScore = null;
let lastHint = null;
let lastProgressKey = null;

function buildAlphabet(words) {
  const set = new Set();
  for (const w of words) {
    for (const ch of w.word.toLowerCase()) {
      if (/[a-zа-яё]/i.test(ch)) set.add(ch);
    }
  }
  return Array.from(set).join("");
}

function clearTiles() {
  for (const el of tileEls.values()) el.remove();
  tileEls.clear();
  protectedIds.clear();
}

function onCatch({ correct, tile }) {
  const el = tileEls.get(tile.id);
  if (el) {
    el.classList.add(correct ? "catch-good" : "catch-bad");
    protectedIds.add(tile.id);
    setTimeout(() => {
      el.remove();
      tileEls.delete(tile.id);
      protectedIds.delete(tile.id);
    }, 220);
  }
  basketEl.classList.toggle("hit-bad", !correct);
  if (!correct) {
    setTimeout(() => basketEl.classList.remove("hit-bad"), 220);
  }
  if (correct) playCatchCorrect();
  else playCatchWrong();
}

function onRoundComplete({ word, flawless }) {
  recordWordResult(currentLang, word.id, { won: true, flawless });
  const justMetGoal = recordWordCompleted();

  overlayTextEl.textContent = justMetGoal
    ? `🔥 Цель дня выполнена! Серия: ${getProgress().streak}`
    : `«${word.word}» — верно!`;
  overlayEl.classList.remove("hidden");
  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(() => overlayEl.classList.add("hidden"), justMetGoal ? 1600 : 700);
  playWordComplete();
}

function onGameOver({ score, wordsCompleted, failedWord }) {
  stopLoop();
  if (failedWord) {
    recordWordResult(currentLang, failedWord.id, { won: false, flawless: false });
  }
  document.getElementById("results-score").textContent = String(score);
  document.getElementById("results-words").textContent = String(wordsCompleted);
  showScreen("results");
  playGameOver();
}

function renderHud() {
  const { lives, score } = game.state;
  if (lives !== lastLives) {
    livesEl.textContent = "❤".repeat(Math.max(0, lives));
    lastLives = lives;
  }
  if (score !== lastScore) {
    scoreEl.textContent = String(score);
    lastScore = score;
  }
  const hint = game.state.currentWord ? game.state.currentWord.hint : "";
  if (hint !== lastHint) {
    hintEl.textContent = hint;
    lastHint = hint;
  }

  const progressKey = `${game.state.targetLetters.join("")}:${game.state.progressIndex}`;
  if (progressKey !== lastProgressKey) {
    progressEl.innerHTML = "";
    game.state.targetLetters.forEach((letter, i) => {
      const span = document.createElement("span");
      span.className = "progress-letter" + (i < game.state.progressIndex ? " filled" : "");
      span.textContent = i < game.state.progressIndex ? letter.toUpperCase() : "_";
      progressEl.appendChild(span);
    });
    lastProgressKey = progressKey;
  }
}

function renderTiles() {
  const rect = fieldEl.getBoundingClientRect();
  const currentIds = new Set(game.state.tiles.map((t) => t.id));

  const toRemove = [];
  for (const id of tileEls.keys()) {
    if (!currentIds.has(id) && !protectedIds.has(id)) toRemove.push(id);
  }
  for (const id of toRemove) {
    tileEls.get(id).remove();
    tileEls.delete(id);
  }

  for (const tile of game.state.tiles) {
    let el = tileEls.get(tile.id);
    if (!el) {
      el = document.createElement("div");
      el.className = "letter-tile";
      el.textContent = tile.char.toUpperCase();
      fieldEl.appendChild(el);
      tileEls.set(tile.id, el);
    }
    const xPx = tile.x * rect.width - 20;
    const yPx = tile.y * rect.height - 20;
    el.style.transform = `translate(${xPx}px, ${yPx}px)`;
  }

  const basketXPx = game.state.basketX * rect.width - 32;
  basketEl.style.transform = `translate(${basketXPx}px, 0)`;
}

function loop(ts) {
  if (!lastTs) lastTs = ts;
  const dtMs = ts - lastTs;
  lastTs = ts;

  if (holdDir !== 0) {
    game.moveBasketBy(holdDir * BUTTON_MOVE_SPEED * (dtMs / 1000));
  }
  game.update(dtMs);
  renderHud();
  renderTiles();

  if (!game.state.over) {
    rafId = requestAnimationFrame(loop);
  }
}

function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastTs = 0;
  holdDir = 0;
}

export function stopGame() {
  stopLoop();
  clearTiles();
}

export function startGame() {
  unlockAudio();
  clearTiles();
  overlayEl.classList.add("hidden");
  lastLives = lastScore = lastHint = lastProgressKey = null;

  currentLang = getActiveLanguage();
  const words = getWords(currentLang);
  if (words.length === 0) return;
  const alphabet = buildAlphabet(words);

  game = createGame(
    words,
    alphabet,
    { onCatch, onRoundComplete, onGameOver },
    { getWeight: getWordWeight }
  );
  game.start();
  game.setBasketX(0.5);

  renderHud();
  renderTiles();

  lastTs = 0;
  rafId = requestAnimationFrame(loop);
}

function pointerToX(clientX) {
  const rect = fieldEl.getBoundingClientRect();
  return (clientX - rect.left) / rect.width;
}

let dragging = false;

fieldEl.addEventListener("pointerdown", (e) => {
  dragging = true;
  if (game) game.setBasketX(pointerToX(e.clientX));
});
fieldEl.addEventListener("pointermove", (e) => {
  if (dragging && game) game.setBasketX(pointerToX(e.clientX));
});
window.addEventListener("pointerup", () => {
  dragging = false;
});

function bindHold(btn, dir) {
  const start = (e) => {
    e.preventDefault();
    holdDir = dir;
  };
  const end = () => {
    holdDir = 0;
  };
  btn.addEventListener("pointerdown", start);
  btn.addEventListener("pointerup", end);
  btn.addEventListener("pointerleave", end);
  btn.addEventListener("pointercancel", end);
}

bindHold(btnLeft, -1);
bindHold(btnRight, 1);

document.getElementById("btn-play-again").addEventListener("click", () => {
  startGame();
  showScreen("game");
});
