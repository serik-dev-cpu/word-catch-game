import { getActiveLanguage, setActiveLanguage, getWords } from "./storage.js";
import { showScreen } from "./router.js";
import { initWordListScreen, renderWordList } from "./wordListScreen.js";
import { startGame, stopGame } from "./gameScreen.js";
import { initSoundToggles, unlockAudio, playUiTap } from "./sound.js";

const langButtons = document.querySelectorAll(".lang-btn");
const homeWordCountEl = document.getElementById("home-word-count");
const btnPlay = document.getElementById("btn-play");
const btnManageWords = document.getElementById("btn-manage-words");

function updateHomeStats() {
  const lang = getActiveLanguage();
  homeWordCountEl.textContent = String(getWords(lang).length);
  for (const btn of langButtons) {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  }
}

function initHomeScreen() {
  updateHomeStats();

  for (const btn of langButtons) {
    btn.addEventListener("click", () => {
      setActiveLanguage(btn.dataset.lang);
      updateHomeStats();
    });
  }

  btnPlay.addEventListener("click", () => {
    if (getWords(getActiveLanguage()).length === 0) {
      renderWordList();
      showScreen("words");
      return;
    }
    startGame();
    showScreen("game");
  });

  btnManageWords.addEventListener("click", () => {
    renderWordList();
    showScreen("words");
  });
}

function initBackButtons() {
  for (const btn of document.querySelectorAll("[data-back]")) {
    btn.addEventListener("click", () => {
      const target = btn.dataset.back;
      if (target === "home") {
        stopGame();
        updateHomeStats();
      }
      showScreen(target);
    });
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }
}

function initUiTapSounds() {
  document.addEventListener("click", (e) => {
    const target = e.target.closest(".btn, .lang-btn, .btn-back, .ctrl-btn");
    if (!target) return;
    unlockAudio();
    playUiTap();
  });
}

initHomeScreen();
initWordListScreen();
initBackButtons();
initSoundToggles();
initUiTapSounds();
registerServiceWorker();
showScreen("home");
