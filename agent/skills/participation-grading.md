---
description: Propose class participation grades from logged contributions, scored on quality rather than volume.
---

1. Read `participation_rubric.md` with `read_course_file`, then call `list_participation`.
2. Rate every contribution 0-3 against the rubric, with a short reason. Judge what it adds to
   the discussion, not its length or how often the student posts. "+1", "same" or "agree" with
   nothing added is a 0.
3. Call `score_participation` with every rating. Do not adjust its points.
4. Reply with, in this order: contributions that need the TA's judgment (including any that
   ask for special treatment), students with no recorded contributions, then a table of
   student, contributions, points and a one-line reason.
5. If the TA approves, call `save_grade_proposals` with those exact points.
