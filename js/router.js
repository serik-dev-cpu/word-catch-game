const screens = document.querySelectorAll(".screen");

export function showScreen(name) {
  for (const el of screens) {
    el.classList.toggle("hidden", el.dataset.screen !== name);
  }
}
