# 0010. When a cat is really stuck, walk along the obstacle for a moment

- Status: accepted (extends 0006)
- Date: 2026-11-22
- Round: 5 (R47 big hunt; affects R23 and R25)

## Decision (Y-statement)

In the context of **the big hunt (R47), where clanmates must cross the camp to surround a hare**,
facing **a clanmate that stood still forever in a pocket between the leader's hut and the Highrock:
the step-by-step steering from decision 0006 kept switching sides and stepping back and forth, which
looked like progress frame by frame**,
we decided for **checking every half second how far the cat itself really moved. If it hardly moved
while trying to walk, it walks along the obstacle (90° to its goal, on its usual side) for 1.2 seconds,
then steers normally again. We also made the hut wall and `insideHut()` agree on where "inside"
starts, so no thin band is left where a cat counts as outside but gets pushed back in**,
and neglected **grid path planning (A*), and simply raising the number of steering angles tried**,
to achieve **cats that get out of pockets without a path planner, while cats that move freely (or chase
something that runs away) are not affected**,
accepting **that a stuck cat wobbles for about half a second before it starts walking along the
obstacle, and that a very deep U-shaped trap could still need more than one try.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Grid path planning (A*) | Rejected in 0006 for its size, and still not needed: the camp has only small pockets. |
| Try more steering angles | Doesn't help. In a pocket every angle is blocked or leads back, so the cat still swings in place. |
| Judge "stuck" by distance to the target | Tried first. Kits chasing each other never get closer to a target that runs away, so they were wrongly treated as stuck and drifted out to the camp edge. |

## Consequences

- `moveToward()` keeps `stuckFrom`, `stuckClock`, `detour` and `detourHeading` on each cat.
- `pushOutOfObstacles()` decides which side of a hut wall a cat is on with the same `R − 0.05` line as `insideHut()`.
