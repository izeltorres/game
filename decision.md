# Decisions

## Session 1 (2026-11-21)

- The project lives in a git repository called `game`, hosted on GitHub at https://github.com/izeltorres/game.
- The GitHub repository is public.
- Build the first version of the game from `problem.md` and `spec.md`.

## Session 2 (2026-11-21) - Round 1

- Build Round 1 (R6–R11) from `problem.md`.
- R11: rebuild the game in 3D with Three.js, with the camera low and behind the cat.
- R9: after the apprentice task the player chooses Warrior, Deputy or Medicine cat. Warriors and
  deputies who hunt and fight enough become Leader. A leader can order clanmates (follow / hunt / guard).
- R10: one full day and night lasts one real hour.
- R6: every clan can climb trees a little; ThunderClan climbs best.
- Design records for this round's technical choices are in `docs/decisions/`.

## Session 3 (2026-11-21) - Round 2

- Build Round 2 (R12–R20) from `problem.md`.
- R15/R16: split the world into 4 clan territories, each with its own look (ThunderClan oak forest,
  RiverClan riverside, WindClan open moor, ShadowClan pine marsh). Your camp is in your own territory.
- R13: keep the squirrel as the kit task, and add easy prey (beetles, mice) that anyone can catch all game.
- R17: add a pounce attack, a dodge and a bite to the swipe.
- R19: 3 mentors, each with one specialty and a bonus that lasts all game.
- R18: any cat picks herbs into a small personal pouch (opened with H) to heal itself. Medicine cats
  can also heal injured clanmates.
- R20: the homebase is a full clan camp with dens (rest to heal and skip to morning) and a fresh-kill pile.
- R14: hold a key to scent the air. Glowing trails lead to nearby prey, even through trees.

## Session 4 (2026-11-21) - Round 3

- Build Round 3 (R21–R29) from `problem.md`. The owner renumbered the duplicate R25, so the round is R21–R29.
- R21: rename the game Cat Clans. The start screen gets a proper title-screen look, and the preview
  cat should look more like a cat. Add the patterns Tuxedo, Calico/tortoiseshell, Spotted and Colorpoint.
- R26: no menu button on screen. Esc opens the main menu (Resume, Restart, New cat).
- R25: walk into huts; the camera follows you inside.
- R29: cats in other clans' camps defend their camp (they attack on their land when you come close).
- R22: remove only the name/rank/clan line. Keep the task, clock, territory and bars.
- R27: drop carried prey anywhere with a key (G); it can be picked up again.

## Session 5 (2026-11-21) - Round 4

- Build Round 4 (R30–R46) from `problem.md`. There is no R33 or R34.
- R42/R45: kits stay in camp and must catch a mix of beetles and mice (5 beetles, 3 mice) to become apprentices.
- R44/R45: the mentor's tasks are a border patrol, hunting a squirrel, catching fish, and chasing off a rogue.
- R36/R39: only deputy → leader needs training. The deputy takes a camp kit as its apprentice
  and trains it with lessons together (hunting, battle practice, border patrol).
- R37: losing the ninth life is game over.
- R32: tilt the camera with the mouse.
- R35: a realistic fish model and real 3D fishing (swipe when a fish is under your paw).
- R30: weather is clear, rain, fog, wind and thunderstorms.
- R38: keep the hunger rule as it is.
- R40: the clan leader gives a random warrior name in a short ceremony.
- R31: 4 playing kits in your camp, and kits in the other camps too (they hide when you come near).
- R46: idle life, better moves, and eating/hurt animations.

## Session 6 (2026-11-21/22) - Round 5

- Build Round 5 (R47–R57) from `problem.md`.
- R47: prey sizes means new kinds: voles and sparrows (small), rabbits (medium), hares (big).
- R47: the leader's big hunt: the leader and 3 clanmates surround a hare together.
- R48: full-moon Gatherings in the middle of the world with a truce; the leader gives a speech.
- R50: leader decisions are events with 2–3 choices that change the whole clan.
- R49: deputy missions are carrying a message, recovering stolen prey, and finding a lost kit.
- R54: each clan has a rivalry meter, shown on the map, with raids when it is high.
- R52: every camp has a medicine cat.
- R53: click the herb you aim at, using an aiming dot in the middle of the screen.
- R55: the game fills the browser window.
- R56: prey in camp is slower and less wary for kits.
- R57: medicine cats get collecting quests, a herb store, treating clanmates, and ranks.

## After Round 5 (2026-11-22) - answers to open questions

- Leaders should be visible.
- Rival clans' medicine cats should take care of their own clan.
- Hut lighting is fine as it is (no change).
- Beetles do count as prey, but only a small amount.

## Session 7 (2026-11-22) - Round 6

- Build Round 6 (R58–R69 in `problem.md`), plus the three settled items from after Round 5
  (numbered R70–R72 in `spec.md`).
- R70–R72: leaders are visible, rival medicine cats treat their own clan, and 4 beetles = 1 prey.
- R58: the mentor has a solid body, shows you how to do each task, and you can talk to them.
- R61: all sound is synthesized (no sound files).
- R62: rogues come in packs, are stronger and smarter, roam and hunt you, and steal and hurt in camp.
- R63: share tongues, play with kits, and camp cats interact with each other.
- R64: climbing lets you see further, escape danger, catch prey in trees, and is a mentor task.
- R69: seasons change every 30 game days.
- R59: the river gets flowing water, banks and stones, depth, and life in the river.
- R60: textures for ground, trees and rocks, cat fur, and huts and water.
- R65, R67, R68: the proposed defaults for the pile, markers and trees.
