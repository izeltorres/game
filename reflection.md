# reflection.md

In the project you developed further, what did a fresh session get wrong or ask about that an earlier round had already settled? What was missing from the repository that would have prevented it?
The rogue spawning, in round 7 i added that rogues shoudn't come as often, but i definestly wasn't specific enough, which i then had to elaborate on and clear up in round 8 with R83, and also by answering questions in the session to claude.

In the round that changed an earlier requirement, what broke? Did the tests catch it, and does the decision record explain the change to someone who was not there?
R58, making the cats solid, which affect tests, and was cought. it is found in the handoff file, in warnings.
- **Solid cats (R58):**
  - `pushPlayerOutOfCats()` keeps you `CAT_BODY` (0.75) away from cats; kits get 3/4 of that.
  - `moveToward()` refuses a step that would take a cat closer to you than that, so cats stop when they
    reach you.
- **Cats are solid now (R58), and that affects tests.**
  - A check that walks the player forward toward a cat (an enemy in front, a mentor, a kit) is stopped
    about 0.75 units short.
  - The R17 pounce check had to walk away from the rogue instead.
  - If a movement check suddenly fails, look for a cat in the way first.

Name one test that caught a real problem, or one test the assistant wrote that checked nothing useful. Quote it.
"- **E order** (`doAction()`):
  1. An enemy in front.
  2. Sparring.
  3. `tryInteract()`.
  4. Prey in reach.
  5. `tryTalk()` (mentor talk, grooming, kit play).
  6. Fishing.

  Talking and grooming come *after* prey on purpose. Before that change, the mentor beside you stole
  the squirrel pounce." 
the e button was used for a LOT of actions.

Choose one commit you would now write differently, and say how.
I would make the levels clearer from the start (R3) and anything with the rogues(R62). I would elaborate every level from the start instead of having to check how it looks and works after ever update. Same with the rogues as it is an essential part of leveling up.

Choose one function in the project you developed further that you did not read while building it. Without an assistant open, read it and write what you think it does, in two or three sentences. Then ask an assistant, and say what you got right and wrong.
R70-make all the important cats have small nametags, i think it just adds a nametag to the medicine cat, mentor and leadercat.
- **Nametags (R70):**
  - `importantCats()` returns your mentor (while you are an apprentice), your apprentice (while you
    are deputy), every leader that hasn't retired, and every medicine cat.
  - `render3d.js` `updateRound7View()` keeps one canvas-text sprite per cat in `view.nametags`
    (`userData.source`, `userData.text`). A tag shows only within `NAMETAG_RANGE` (25 units).
  - There are no deputy cats (owner's choice).
