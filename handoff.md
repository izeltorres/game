# Handoff

## Where the project stands (2026-11-21)

The first playable version is built and pushed to GitHub. It follows `spec.md`:

- **The cat:** starts as a kitten. The player picks a name, fur colour, eye colour, pattern and clan.
- **Background:** a side-view forest with scrolling layers, waving grass and swaying tree leaves.
- **Tasks:**
  - Level 1: hunt a squirrel, and the cat grows.
  - Level 2: go fishing, and the cat becomes an apprentice.
  - Level 3: fight a rogue cat, and the cat becomes a warrior.
- **Clans:** ThunderClan, RiverClan, WindClan and ShadowClan, each with a small perk.

The game is 2D and drawn on an HTML canvas. The camera follows the cat from the side, which is how it shows the cat in third person. `tests.html` has 30 automatic checks, and all of them pass.

## Open questions for the owner

1. **SkyClan:** `problem.md` lists SkyClan, but `spec.md` lists only 4 clans, so SkyClan is not in the game. Should it be added?
2. **Roles:** `problem.md` says the player should choose between warrior, leader and medicine cat. `spec.md` ends at warrior, so there is no role choice yet. Should this be added?
3. **Name:** "Forest Clans" is a placeholder title. Keep it or rename it?
4. **Spec file name:** `CLAUDE.md` calls the spec `SPEC.md`, but the file is `spec.md`.

## Next steps

- Turn on GitHub Pages (repo **Settings** → **Pages** → deploy from the `master` branch) so the game can be played online.
- Answer the open questions above, update `spec.md`, then build the changes.
- Possible extras: save progress in the browser, sounds, more tasks after warrior.
