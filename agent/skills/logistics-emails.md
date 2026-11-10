---
description: Draft replies to student logistics emails (office hours, deadlines, exam dates, policies) from the course documents.
---

1. Call `read_inbox` and read `course_policies.md` with `read_course_file`.
2. Sort the emails. Logistics questions the policies answer get a drafted reply. Requests for
   an extension, regrade, accommodation, exception, or anything personal or sensitive go to the
   TA: draft only a short acknowledgement that the request was passed to course staff, with no
   decision and no promise.
3. Reply to the TA with the emails that need a decision first, then each draft in full.
4. Call `save_reply` for each draft, with the email id as `inReplyTo`.
