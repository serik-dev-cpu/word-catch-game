# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Word Catch — a mobile-first vocabulary PWA. Letters fall down a 5-lane field; the
player drags a basket to catch them in order and spell the word behind the hint.
Study languages: Russian, English, Uzbek.

## Commands

There is no build step, no package manager, no test runner and no linter. It is a
zero-dependency static site of hand-written ES modules — the files in the repo are
the files that ship.

Serve it over HTTP (never open `index.html` via `file://` — ES modules and the
service worker both need a real origin):

```powershell
# Windows — the checked-in dev server, also wired up as .claude/launch.json
powershell.exe -NoProfile -ExecutionPolicy Bypass -File server.ps1 -Port 8080
```

```bash
# any other platform
python3 -m http.server 8080
```

Verification is manual: open `http://localhost:8080/`, and use DevTools device
emulation since the layout targets portrait phones. When testing storage or seed
changes, clear the `vocabgame:v1` localStorage key to simulate a first-time
player, and hard-reload with "Update on reload" checked so the service worker
doesn't serve a stale shell.

Deploy: push to `main`. `.github/workflows/deploy-pages.yml` publishes the repo
root to GitHub Pages (`https://serik-dev-cpu.github.io/word-catch-game/`). Feature
branches don't deploy.

## Architecture

### Screens live in one HTML file

`index.html` contains all four screens (`home`, `words`, `game`, `results`) as
static `<section class="screen" data-screen="...">` markup. `js/router.js` does
nothing but toggle `.hidden`. There is no templating and no client-side routing —
to add a screen, add a section to `index.html` plus a module that queries its
elements at import time and exports `init*`/`render*` functions. `js/app.js` wires
everything together at the bottom of the file.

### The deliberate layering

- `js/game.js` — **pure game logic, no DOM and no storage access.** `createGame()`
  takes a word array, a decoy alphabet, callbacks and options, and returns
  `{ state, start, update, setBasketX, moveBasketBy }`. It knows nothing about how
  it is drawn or persisted. Keep it that way; it is the only part that could be
  unit-tested without a browser.
- `js/gameScreen.js` — the only place that owns the `requestAnimationFrame` loop,
  writes DOM for tiles/HUD, and bridges game outcomes into storage.
- `js/storage.js` — the only module that touches `localStorage`.

Positions in game state are normalized fractions of the field (`0..1`) for `x`,
`y` and `basketX`. `gameScreen.js` multiplies them by the field's bounding rect;
the `- 20` / `- 32` offsets there are half of the tile and basket pixel sizes in
CSS, so they must change together with the CSS.

### Storage is a module-level singleton

`storage.js` runs `let state = load()` at import time and every mutator calls
`save()` immediately. There is no reactivity — after mutating, callers re-render
by hand (e.g. `updateHomeStats()` in `app.js`).

Persisted shape under the `vocabgame:v1` key:

```
{ version, languages: { ru|en|uz: { words: [...] } }, settings, progress }
```

Migrations are forward-only backfills, not version bumps: `ensureProgress()` fills
in fields that older saves lack. **Add new persisted fields there** so existing
players don't hit `undefined`.

### Seed words: positional ids are load-bearing

`js/data/seedWords.js` holds one table of ~100 concepts, each spelled in all three
languages. Built-in word ids are derived from table *position*
(`seed_<lang>_<NNN>`), and `refreshBuiltInWords()` re-derives every built-in
word's text and hint from that id on every load. That is what lets the player
switch hint language and have the whole starter set re-label itself while each
word's mastery level survives.

Consequence: **append to `SEED_PAIRS`, never reorder or delete entries** —
reordering silently rewires saved progress to different words. Adding a new
language means adding a key to every pair plus `SEED_LANGS`.

### Spaced repetition

A Leitner ladder in `word.stats.level` (0–5). A flawless win promotes a word, any
mistake or loss demotes it. `getWordWeight()` returns `2 ** (5 - level)`, so a new
word is drawn 32× as often as a mastered one. That function is passed into
`createWeightedPicker()` (`js/utils.js`), which re-evaluates weights on every draw
and refuses to return the same word twice in a row — so in-place mastery updates
take effect on the very next pick.

"Flawless" is tracked per word inside `game.js` (`mistakesOnWord`), and a loss
reports the in-progress word as `failedWord` so `gameScreen.js` can demote it
rather than dropping the attempt.

### Daily goal and streak

Keyed by **local** calendar day (`dayKey()`), not UTC, so the day rolls over at
the player's midnight. `rollOverDay()` resets the counter lazily on read/write.
A streak is only reported as alive if `lastGoalDate` is today or yesterday;
otherwise `getProgress()` returns `0` without mutating stored state.

### Service worker: two things that will bite you

`service-worker.js` is cache-first with an explicit `APP_SHELL` file list.

1. **Adding any JS or CSS file means adding it to `APP_SHELL`,** or offline mode
   breaks for that file.
2. **Bump `CACHE_NAME`** (currently `word-catch-v7`) on every change that touches
   shipped files, or returning players keep getting the cached old version. Every
   feature commit in this repo's history bumps it.

### Sound

`js/sound.js` synthesizes everything with Web Audio oscillators — there are no
audio assets. Because mobile browsers block audio until a gesture, `unlockAudio()`
is called from the global click handler in `app.js` and from `startGame()`. Audio
failures are swallowed on purpose. The mute state lives in settings and there are
two `.sound-toggle` buttons (home and game HUD) kept in sync by
`syncSoundButtons()`.

## Conventions

- UI chrome text is hardcoded Russian in `index.html` and in the JS modules. The
  `nativeLanguage` setting only chooses the language of word *hints* — it does not
  localize the interface. Don't confuse the two.
- `css/styles.css` holds the design tokens (`:root` custom properties) and shared
  screen/button styles; `css/game.css` is only the play field, HUD and tiles.
  Use the existing custom properties rather than new literal colors.
- `wordListScreen.js` builds the word-pair row with `innerHTML`, so user-entered
  text goes through the local `escapeHtml()`. Keep that if you extend the row.
- The design target is a phone in portrait: `body` has `overflow: hidden`,
  `user-select: none`, and safe-area insets come from the `--safe-*` variables.
