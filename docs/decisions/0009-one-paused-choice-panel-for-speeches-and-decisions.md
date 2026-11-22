# 0009. One paused choice panel for Gathering speeches and leader decisions

- Status: accepted
- Date: 2026-11-22
- Round: 5 (R48, R50)

## Decision (Y-statement)

In the context of **R48 (speaking at Gatherings) and R50 (a leader's big decisions)**, after the owner
chose events with 2–3 choices,
facing **two features that both need to put a question to the player and change the clan depending on
the answer**,
we decided for **a single `pendingChoice` object in `game.js` (`{ kind, title, text, options: [{ label,
apply }] }`), shown by one panel in `script.js`, that pauses the game until `chooseOption(i)` runs the
chosen option's effect**,
and neglected **a separate screen and code path for speeches and for decisions, and choices made
while the game keeps running (for example by pressing a number key)**,
to achieve **one place to add new events or speeches, effects that the tests can trigger and check
directly (`triggerDecision(id)`), and no danger of being attacked while reading**,
accepting **that the game stops briefly for every event, and that number keys are not used for choices
(they already give leader orders and use herbs).**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Separate panels for speeches and decisions | Twice the page and game code, for the same thing. |
| Choose while the game keeps running | A leader in a fight would miss the choice or take damage while reading. The number keys are already taken. |

## Consequences

- `update()` skips the world while `pendingChoice` is set, the same way it does for the mentor and role choices.
- A new decision is one entry in `DECISIONS` in `game.js`: a title, a text, and options with `apply` functions.
