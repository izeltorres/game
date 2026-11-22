# 0014. The patrol you call is your camp's own cats

- Status: accepted
- Date: 2026-11-22
- Round: 7 (R75 call for help against a rogue pack)

## Decision (Y-statement)

In the context of **letting the player call a patrol of clan warriors to help against a rogue pack
(R75), which the owner chose instead of a leader's clanmates or nearby cats**,
facing **the question of where the patrol's cats come from, when the camp only has four named camp
cats (three warriors and the nursing queen) and the game already has many cat models**,
we decided for **sending the camp's own warriors that aren't hurt (up to three; never the queen): they
get a `helping` flag, `updateCampCats()` leaves them alone, and `updateHelpers()` runs them out to the
fight with `moveToward()` and back to camp afterwards**,
and neglected **creating three new patrol cats each time help is called, and giving every clan a
separate list of patrol warriors who live in camp**,
to achieve **help from cats the player already knows by name, no new models, and a camp that visibly
empties while its warriors are out fighting**,
accepting **that fewer than three may come when camp cats are hurt, and that while they are away the
camp cats don't groom, eat or pair up (R63, R66).**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Make three new cats for each call | Unknown names, new models every call, and cats that appear from nowhere at the camp. |
| A separate list of patrol warriors for every clan | More cats and models on top of about 50 already, for a feature used now and then. |

## Consequences

- A camp cat has `helping`, `helpTimer`, `swipeTimer` and `attackTimer` while answering a call.
- One rogue from a pack running off no longer counts as a fight won; beating the pack leader does.
