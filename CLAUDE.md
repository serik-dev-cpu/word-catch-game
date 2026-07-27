# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules — read these first, they are not negotiable

Every rule below exists because breaking it has already cost this project real
rework. The history is written down with each one so you cannot reason your way
past it. When a rule and a convenient shortcut disagree, the rule wins.

### 1. There is one of everything. Never build a second.

| Concern | The one thing that owns it | Never |
|---|---|---|
| Project rules and context | `CLAUDE.md` | a second rules/context/handoff doc |
| Publishing | `.github/workflows/deploy-pages.yml` | a second workflow, or Pages served from a branch |
| Automated checking | `.github/workflows/checks.yml` | a parallel test/lint runner |
| Local serving | `server.ps1` + the python entry in `.claude/launch.json` | a third server script |
| `localStorage` | `js/storage.js` | reading or writing it anywhere else |
| The render loop | `js/gameScreen.js` | a second `requestAnimationFrame` loop |
| Word data | `js/data/seedWords.js` | a parallel or "temporary" word list |

Before creating **any** file, look for the one that already does that job and
extend it. A second implementation never replaces the first — it diverges from
it silently, and then both rot in opposite directions.

*Already happened here:* Pages published from a legacy branch build **and** the
Actions workflow at the same time; two builders raced on every push for days
before anyone noticed.

### 2. Commit straight to `main`. Do not open branches.

`main` is unprotected on purpose. This repo is edited from a laptop, a phone and
cloud sessions, so a branch that outlives its session becomes a stale fork that
quietly loses everything shipped after it.

Always `git fetch origin main` and read the log **before** you start, so you
learn what another session shipped instead of building on stale code.

*Already happened twice:* `claude/game-project-sound-multi-*` and
`claude/archive-chats-notebook-issue-*` both sat unmerged while `main` moved on.
Both had to be reconciled by hand, and one of them was already missing fixes.

### 3. When something is blocked, say so plainly. Do not route around it.

If you cannot do what was asked — a setting you can't reach, a check you can't
run, a URL the sandbox blocks — the answer is a short, direct *"I can't do X,
and here is why."*

It is **never** a new folder, a duplicate config, a second script, or a copy of
something that already exists. Name the cost out loud instead:

> "I won't do that — it would leave two deploy paths / two word lists / two rules
> files, and they will drift apart into a mess."

A blocked task reported honestly costs one message. A parallel structure invented
to dodge it costs days of untangling.

### 4. Finish the request you were actually given.

If you were asked to check, review or fix something, land it before moving on to
anything more interesting — including a new topic the user raises later in the
same turn. If you must set it aside, say so explicitly rather than letting it
disappear.

*Already happened here:* a request to review the sound version was dropped
mid-way for a different topic and only finished several turns later, after the
user asked again.

### 5. Report only what you actually observed.

Run the check, read its output, then say what the output said. Prove a guard
works by breaking something on purpose and watching it fail. If you could not
verify something — the browser pane was hidden, the network blocked the URL —
say so in the same breath as the result, not later and not never.

Never tick off a checklist item, bump a version, or call a task done on the
assumption that it worked.

## What this is

Word Catch — a mobile-first vocabulary PWA. Letters fall down a 5-lane field; the
player drags a basket to catch them in order and spell the word behind the hint.
Study languages: Russian, English, Uzbek.

## Commands

There is no build step, no package manager, no test runner and no linter. It is a
zero-dependency static site of hand-written ES modules — the files in the repo are
the files that ship.

Serve it over HTTP (never open `index.html` via `file://` — ES modules and the
service worker both need a real origin). `.claude/launch.json` has a config for
each platform — `word-catch-dev` (Windows) and `word-catch-dev-python`
(everywhere else):

```powershell
# Windows — the checked-in dev server
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
branches don't deploy. Pages is set to `build_type: workflow`, so that workflow is
the only publisher — do not add a second one or re-enable branch-based publishing.

`.github/workflows/checks.yml` enforces the invariants below on every push and
PR: modules parse, the seed table is intact, `game.js` stays pure, `APP_SHELL`
matches the files on disk, and only one deploy workflow exists. Since work often
happens from a phone with no way to run a browser locally, **treat CI as the
verification step** — read the run's output rather than assuming a push was fine.

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

### Service worker: three things that will bite you

`service-worker.js` is cache-first with an explicit `APP_SHELL` file list.

1. **Adding any JS or CSS file means adding it to `APP_SHELL`,** or offline mode
   breaks for that file. CI fails the push if you forget.
2. **`CACHE_NAME` is stamped automatically at deploy** — the workflow rewrites
   that line with the commit sha, so you never bump it by hand. Keep the line in
   its exact shape (`const CACHE_NAME = "...";`) or the stamp silently misses.
   The value committed to git is only a local-development placeholder.
3. The worker **does not** call `skipWaiting()` on install. A new version parks
   itself and `watchForUpdates()` in `app.js` offers the player an "Обновить"
   button; accepting posts `SKIP_WAITING` and reloads. This is what stops an
   update from interrupting a round — don't "simplify" it back to auto-activate.

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
