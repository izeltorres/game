# 0015. Save progress as plain data in the browser's local storage

- Status: accepted
- Date: 2026-11-22
- Round: 8 (R84 save progress)

## Decision (Y-statement)

In the context of **saving a cat's progress (R84) in a game that must stay free (no server or
account), open straight from the file system, and keep `game.js` free of page code**,
facing **a game state of thousands of values (every cat, prey, tree and timer) of which only a small
part is real progress, and the owner's wish for autosave, a Continue list, a Save button and 3 slots**,
we decided for **`saveData()` in `game.js`, which picks out the progress (cat, rank, tasks, stats,
medicine path, health and food, rivalries, borders, day and season, the fresh-kill pile, the
apprentice's lesson) as plain data, and `loadData()`, which starts a fresh game and puts that progress
back, rebuilding deputies and leaders the way a promotion does. `script.js` keeps the 3 slots as JSON
in `localStorage`, under a separate key on the test page**,
and neglected **saving the whole game state, saving to a downloaded file, and an online save service**,
to achieve **small saves that keep working when cats, prey or timers change in later rounds, rules
that still don't touch the page, and tests that never overwrite the player's own saves**,
accepting **that cats, prey and weather start fresh when a game is loaded, that saves live in one
browser on one computer (clearing site data deletes them), and that new kinds of progress must be added
to `saveData()`/`loadData()` by hand.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Save the whole game state | Large, full of references between objects (trees, tree branches, kits as apprentices) that JSON can't keep, and it breaks every time a round adds a field. |
| Save to a downloaded file | Works across browsers, but autosave and Continue would mean the player picking files all the time. |
| An online save service | Needs an account or a paid server; the project must stay free. |

## Consequences

- `hooks.saveNow` is how `game.js` asks for a save (`requestSave()`, after ranking up, choosing a path
  or mentor, and waking up); `loadingSave` stops a load from saving halfway through.
- Each save gets a `savedAt` number one higher than any other save, so tests can tell a new save from
  an old one without real clock time.
