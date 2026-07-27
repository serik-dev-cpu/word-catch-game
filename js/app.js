import {
  getActiveLanguage,
  setActiveLanguage,
  getWords,
  getProgress,
  getNativeLanguage,
  setNativeLanguage
} from "./storage.js";
import { showScreen } from "./router.js";
import { initWordListScreen, renderWordList } from "./wordListScreen.js";
import { startGame, stopGame } from "./gameScreen.js";
import { initSoundToggles, unlockAudio, playUiTap } from "./sound.js";
import { initShareButton } from "./shareResult.js";

const langButtons = document.querySelectorAll(".lang-btn");
const homeWordCountEl = document.getElementById("home-word-count");
const btnPlay = document.getElementById("btn-play");
const btnManageWords = document.getElementById("btn-manage-words");
const dailyCardEl = document.querySelector(".daily-card");
const dailyFillEl = document.getElementById("home-daily-fill");
const dailyDoneEl = document.getElementById("home-daily-done");
const dailyGoalEl = document.getElementById("home-daily-goal");
const streakEl = document.getElementById("home-streak");
const streakCountEl = document.getElementById("home-streak-count");
const nativeSelectEl = document.getElementById("native-lang");

function updateDailyCard() {
  const { wordsToday, goal, goalMet, streak } = getProgress();

  dailyDoneEl.textContent = String(wordsToday);
  dailyGoalEl.textContent = String(goal);
  dailyFillEl.style.width = `${Math.min(100, (wordsToday / goal) * 100)}%`;
  dailyCardEl.classList.toggle("goal-met", goalMet);

  streakEl.hidden = streak === 0;
  streakCountEl.textContent = String(streak);
}

function updateHomeStats() {
  const lang = getActiveLanguage();
  homeWordCountEl.textContent = String(getWords(lang).length);
  for (const btn of langButtons) {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  }
  nativeSelectEl.value = getNativeLanguage();
  updateDailyCard();
}

function initHomeScreen() {
  updateHomeStats();

  for (const btn of langButtons) {
    btn.addEventListener("click", () => {
      setActiveLanguage(btn.dataset.lang);
      updateHomeStats();
    });
  }

  nativeSelectEl.addEventListener("change", () => {
    setNativeLanguage(nativeSelectEl.value);
    updateHomeStats();
  });

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

// Shows the update prompt and, once accepted, hands control to the waiting
// worker and reloads onto the fresh shell. Without this the page would keep
// serving the cached old build until every tab was closed — which on a phone,
// with the app pinned to the home screen, is close to never.
function watchForUpdates(registration) {
  const banner = document.getElementById("update-banner");
  const button = document.getElementById("btn-update");
  let accepted = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!accepted) return; // first-ever install claims the page; don't reload for that
    accepted = false;
    window.location.reload();
  });

  const offer = (worker) => {
    banner.hidden = false;
    button.onclick = () => {
      accepted = true;
      banner.hidden = true;
      worker.postMessage({ type: "SKIP_WAITING" });
    };
  };

  // An update may already have been downloaded during a previous visit.
  if (registration.waiting && navigator.serviceWorker.controller) {
    offer(registration.waiting);
  }

  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    if (!installing) return;
    installing.addEventListener("statechange", () => {
      // A fresh install with no existing controller is the first visit, not an
      // update — there is nothing to prompt about.
      if (installing.state === "installed" && navigator.serviceWorker.controller) {
        offer(installing);
      }
    });
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(watchForUpdates)
      .catch(() => {});
  });
}

function initUiTapSounds() {
  document.addEventListener("click", (e) => {
    const target = e.target.closest(".btn, .lang-btn, .btn-back, .ctrl-btn, .icon-btn");
    if (!target) return;
    // The mute button plays its own confirmation tap, so skip it here rather
    // than firing two taps for one press.
    if (target.classList.contains("sound-toggle")) return;
    unlockAudio();
    playUiTap();
  });
}

initHomeScreen();
initWordListScreen();
initBackButtons();
initSoundToggles();
initUiTapSounds();
initShareButton();
registerServiceWorker();
showScreen("home");
