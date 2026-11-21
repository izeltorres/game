# 0003. One fixed map split into four quarters, one per clan

- Status: accepted
- Date: 2026-11-21
- Round: 2 (R15, R16, R20; changes how R6 is shown)

## Decision (Y-statement)

In the context of **R15 (a map with each clan's territory) and R16 (being attacked in another
clan's territory)**, after the owner chose four territories that each have their own look,
facing **the need for a world where every clan's land, camp, water and patrols have a clear place
that the map, the patrols and the tests can all agree on**,
we decided for **one fixed world split into four equal quarters by the lines x = 0 and z = 0
(ThunderClan south-west, ShadowClan north-west, WindClan north-east, RiverClan south-east), with
each camp in the middle of its quarter and every place in a territory described from its camp**,
and neglected **a world that always puts the player's own clan in the middle with the other clans
around it, and separate small areas for each territory joined by paths**,
to achieve **a map that looks the same in every game, a one-line `territoryAt(x, z)` check for
patrols and the HUD, and the same layout for every clan (mirrored), so tasks are equally far for
everyone**,
accepting **that camps moved away from (0, 0), so earlier tests had to place the cat relative to its
own camp, and that a second water strip (the stream) was needed so every territory can fish.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Player's clan always in the middle | The map would change with every clan choice, and the other three clans would get odd, uneven shapes around the middle. |
| Separate areas joined by paths | Borders are clearer, but it needs much more level design and doesn't feel like one forest. Crossing a border would be a path instead of a step. |

## Consequences

- `CAMP`, `ROGUE_HOME` and the herb, rogue and den spots are filled in by `resetGame()` for the
  chosen clan. `spotFor(clan, u, v)` mirrors one layout into each quarter.
- The big river (x 30 to 36) runs through WindClan and RiverClan land, and a stream (x -34 to -30)
  runs through ThunderClan and ShadowClan land.
- Patrols are kept inside their quarter with `keepInTerritory()`, so a patrol never crosses a border.
- ShadowClan's marsh (R6) is now ShadowClan's territory, and players from other clans can walk into it.
