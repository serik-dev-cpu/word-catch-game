import { getActiveLanguage, getWords, addWord, updateWord, deleteWord } from "./storage.js";

const listEl = document.getElementById("word-list");
const formEl = document.getElementById("word-form");
const wordInput = document.getElementById("word-input");
const hintInput = document.getElementById("hint-input");

export function renderWordList() {
  const lang = getActiveLanguage();
  const words = getWords(lang);
  listEl.innerHTML = "";

  for (const w of words) {
    const li = document.createElement("li");
    li.dataset.id = w.id;

    const pair = document.createElement("div");
    pair.className = "word-pair";
    pair.innerHTML = `
      <span class="w">${escapeHtml(w.word)}${w.isBuiltIn ? '<span class="word-badge">базовое</span>' : ""}</span>
      <span class="h">${escapeHtml(w.hint)}</span>
    `;

    const actions = document.createElement("div");
    actions.className = "word-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "icon-btn";
    editBtn.textContent = "✎";
    editBtn.setAttribute("aria-label", "Редактировать");
    editBtn.addEventListener("click", () => enterEditMode(li, w));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "icon-btn danger";
    delBtn.textContent = "✕";
    delBtn.setAttribute("aria-label", "Удалить");
    delBtn.addEventListener("click", () => {
      if (confirm(`Удалить «${w.word}»?`)) {
        deleteWord(lang, w.id);
        renderWordList();
      }
    });

    actions.append(editBtn, delBtn);
    li.append(pair, actions);
    listEl.appendChild(li);
  }
}

function enterEditMode(li, w) {
  const lang = getActiveLanguage();
  li.innerHTML = "";

  const wordEdit = document.createElement("input");
  wordEdit.type = "text";
  wordEdit.value = w.word;
  wordEdit.className = "edit-input";

  const hintEdit = document.createElement("input");
  hintEdit.type = "text";
  hintEdit.value = w.hint;
  hintEdit.className = "edit-input";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "icon-btn";
  saveBtn.textContent = "✓";
  saveBtn.setAttribute("aria-label", "Сохранить");
  saveBtn.addEventListener("click", () => {
    const word = wordEdit.value.trim();
    const hint = hintEdit.value.trim();
    if (word && hint) {
      updateWord(lang, w.id, { word, hint });
    }
    renderWordList();
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "icon-btn";
  cancelBtn.textContent = "✕";
  cancelBtn.setAttribute("aria-label", "Отмена");
  cancelBtn.addEventListener("click", renderWordList);

  const editRow = document.createElement("div");
  editRow.className = "word-pair";
  editRow.append(wordEdit, hintEdit);

  const actions = document.createElement("div");
  actions.className = "word-actions";
  actions.append(saveBtn, cancelBtn);

  li.append(editRow, actions);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

export function initWordListScreen() {
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const word = wordInput.value.trim();
    const hint = hintInput.value.trim();
    if (!word || !hint) return;
    addWord(getActiveLanguage(), word, hint);
    wordInput.value = "";
    hintInput.value = "";
    wordInput.focus();
    renderWordList();
  });
}
