# 0007. Three life stages, with the steps inside each stage kept as lists

- Status: accepted
- Date: 2026-11-21
- Round: 4 (R42, R43, R44, R45)

## Decision (Y-statement)

In the context of **Round 4's new path (kit in camp → apprentice doing its mentor's tasks →
warrior or medicine cat → deputy → leader)**,
facing **code and tests that numbered the old path as 4 stages (0 = kit, 1 = older kit, 2 =
apprentice, 3 = clan cat), where each stage was one task**,
we decided for **3 stages that match a cat's life (`stage` 0 = kit, 1 = apprentice, 2 = clan
cat), with the steps inside a stage kept as data: the kit's mix (`KIT_NEEDS`), the mentor's tasks
(`APPRENTICE_TASKS` and `taskIndex`), and the promotion needs (`DEPUTY_NEEDS`, `LEADER_NEEDS`)**,
and neglected **keeping the 4 stage numbers and skipping stage 1, and adding a new stage number for
every step (kit, each apprentice task, warrior, deputy, leader)**,
to achieve **stage numbers that mean something, and steps that can be added, removed or reordered by
editing a list instead of renumbering code**,
accepting **that every earlier test that set `stage` directly had to be updated, and that the rank
inside stage 2 now comes from `role` (Warrior, Deputy, Leader, Medicine cat).**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Keep 4 stages, skip stage 1 | Least change, but a stage that is never used would confuse the next person reading the code. |
| One stage number per step | The checks for "is an apprentice" or "is a full clan cat" would turn into ranges of numbers, and adding a task would shift all the numbers after it. |

## Consequences

- `currentTask()` names the apprentice's task, `finishTask()` moves to the next one, and
  `checkPromotion()` / `promote()` handle warrior → deputy → leader.
- To change the mentor's tasks, edit `APPRENTICE_TASKS`, `TASK_TEXT` and `taskSpot()` together.
