# Task API notes

All task APIs require the HTTP-only session cookie and scope data to its owner. `POST /api/todos` and `PUT /api/todos/:id` may optionally include `tagIds: number[]`; all IDs must belong to the signed-in user and are applied atomically with the task. Omitting `tagIds` on update retains existing associations.

`GET /api/notifications/check` returns due reminders with a temporary `notification_claim_token`. The client calls `POST /api/notifications/check` with `{todoId, token}` after the browser accepts the notification, or `DELETE` with the same body if displaying it fails. Claims expire after two minutes, so another polling tab can retry a reminder if the original tab closes. Notifications require a permitted, open browser tab; operating-system delivery cannot be guaranteed by a web page.

JSON exports are version 1 and include subtasks and tag names/colors, not database IDs. Imports validate before writing and run as one transaction. Re-importing intentionally creates new tasks; existing tag names are reused case-insensitively.
