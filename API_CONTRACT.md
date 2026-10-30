# Task API notes

All task APIs require the HTTP-only session cookie and scope data to its owner. `POST /api/todos` and `PUT /api/todos/:id` may optionally include `tagIds: number[]`; all IDs must belong to the signed-in user and are applied atomically with the task. Omitting `tagIds` on update retains existing associations.

`GET /api/notifications/check` returns due reminders with a temporary `notification_claim_token`. The client calls `POST /api/notifications/check` with `{todoId, token}` after the browser accepts the notification, or `DELETE` with the same body if displaying it fails. Claims expire after two minutes, so another polling tab can retry a reminder if the original tab closes. Notifications require a permitted, open browser tab; operating-system delivery cannot be guaranteed by a web page.

JSON exports are version 1 and include creation and completion timestamps, subtasks and tag names/colors, not database IDs. Imports accept both current exports with creation timestamps and older exports without them. Offset-based due dates are normalized to Singapore time. Imports validate before writing and run as one transaction. Re-importing intentionally creates new tasks; existing tag names are reused case-insensitively.

When an existing database is upgraded, completed tasks that predate completion tracking receive their last update time (or creation time if no update was recorded). Their original completion times cannot be reconstructed. New completions and exports retain the actual recorded completion time.

Template creation and updates accept optional `tagIds: number[]` owned by the signed-in user. Omitting `tagIds` on update retains existing tags; an empty array removes them. Template listings include `tagIds`, and using a template attaches those tags to the new task. Tag edits are reflected automatically, and deleting a tag removes its template associations.
