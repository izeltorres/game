# 0006. Steer cats around obstacles step by step instead of planning paths

- Status: accepted
- Date: 2026-11-21
- Round: 3 (R23, R25, R29)

## Decision (Y-statement)

In the context of **R23 (cats must not go through rocks and trees) and R25 (huts you can only
enter through a doorway)**,
facing **many computer-controlled cats (camp cats, mentors, clanmates, rogues, patrols, and now 12
rival camp cats) that used to walk in straight lines through everything**,
we decided for **local steering: each step, a cat tries to walk straight at its target and, if
something solid pushes it back, tries turning more and more (sticking to the side it turned last
time). Other cats see every hut doorway as closed except the hut they are entering or leaving, and
they head for that doorway first**,
and neglected **path planning on a grid (A*), and letting computer cats ignore obstacles**,
to achieve **short, readable code with no grid to build or keep up to date, while cats still walk
around trees, rocks and huts and never get trapped in a doorway**,
accepting **that a cat could still get stuck in a tight U-shaped spot (none exists in the world now),
and that the movement is a little wobbly next to obstacles.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| A* path planning on a grid | Finds a way around anything, but needs a grid over a 240 × 240 world, paths that are recomputed as targets move, and much more code than the rest of the movement. |
| Computer cats ignore obstacles | Simplest, but the owner asked that cats don't phase through rocks and trees. |

## Consequences

- `moveToward()` in `game.js` does the steering for every computer cat. `viaDoorway()` routes cats
  in and out of huts.
- `pushOutOfObstacles(body, radius, doorsOpenFor)` treats doorways as open only for the player and,
  for other cats, only for the hut passed in.
- Testing showed why the doors must be closed for passing cats: with all doorways open, a mentor got
  stuck in the nursery doorway in 13 of 60 runs. With them closed, it got stuck in 0 of 60.
