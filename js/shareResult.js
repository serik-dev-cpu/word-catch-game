import { getProgress } from "./storage.js";

const scoreEl = document.getElementById("results-score");
const wordsEl = document.getElementById("results-words");
const feedbackEl = document.getElementById("share-feedback");
const shareBtn = document.getElementById("btn-share");

let feedbackTimer = null;

// Russian counts inflect the noun: 1 слово, 2-4 слова, 5+ слов.
function wordsLabel(n) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 14) return "слов";
  const ones = n % 10;
  if (ones === 1) return "слово";
  if (ones >= 2 && ones <= 4) return "слова";
  return "слов";
}

export function buildShareText({ score, words, streak }) {
  return [
    streak > 0 ? `Word Catch 🔥${streak}` : "Word Catch",
    `${score} очков · ${words} ${wordsLabel(words)}`,
    location.origin + location.pathname
  ].join("\n");
}

function showFeedback(message) {
  feedbackEl.textContent = message;
  feedbackEl.hidden = false;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    feedbackEl.hidden = true;
  }, 2000);
}

async function share() {
  const text = buildShareText({
    score: Number(scoreEl.textContent) || 0,
    words: Number(wordsEl.textContent) || 0,
    streak: getProgress().streak
  });

  // The native sheet is the good path on phones; the clipboard is the fallback
  // on desktop and anywhere the share sheet is unavailable or dismissed.
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    showFeedback("Скопировано!");
  } catch {
    showFeedback("Не удалось поделиться");
  }
}

export function initShareButton() {
  shareBtn.addEventListener("click", share);
}
