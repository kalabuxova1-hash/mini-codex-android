# Mini Codex 0.2.0: service reference

The release worker executes authorized tools on Android. The model in the chat makes decisions; the phone has no independent background AI model.

## Installed release paths

- Magisk module and boot wrapper: `/data/adb/modules/mini_codex`, `service.sh`.
- Packaged code: `/data/adb/modules/mini_codex/agent/phone_agent.py`, `native_phone.py`, `support_runtime.py`.
- Private owner storage: `/data/adb/mini-codex`. Credentials are in `config.json`; do not read or export them for ordinary diagnostics.
- Inventory: `/data/adb/mini-codex/support/passport.json`. Guides may be packaged in the module or installed in the private support directory. Use the paths returned by `phone_status.support`.
- Worker journal and log: `/data/adb/mini-codex/state/jobs.sqlite3`, `state/agent.log`; bounded startup diagnostics: `/data/adb/mini-codex/startup.log`.
- Existing notes and compressed archives: `/data/adb/mini-codex/memory`. Their shared storage budget includes job records and logs. Reuse this memory for confirmed maintenance lessons.
- Runtime: `/data/data/com.termux/files/usr/bin/python`. Retain Termux and its Python installation.

## Diagnose and verify

Start with `phone_status` and search relevant existing memory. A passport records installation metadata, not proof that a service is running. Recheck affected paths, processes and module enable markers before changing them. Refresh using the command returned by `support.refresh_command` after component changes or when stale.

Network dependencies differ between owners. Check the owner's verified configuration and current routes without exporting proxy URLs or credentials. Other Android control plugins may operate a different display; do not reuse their UI coordinates in Mini Codex.

## Android Use coexistence

Android Use is an optional separate plugin. Known component locations are `/data/adb/android-use-relay`, its Magisk module `android_use_relay`, and `/data/local/tmp/android-use-core`. The passport checks path existence and module metadata; these checks do not prove connectivity or display availability. Mini Codex can operate without Android Use installed.

Android Use can operate a separate virtual display. Mini Codex must use its own fresh `read_ui` or screenshot and coordinates from that same surface. Do not reuse nodes, coordinates or job IDs across plugins. Select tools actually available in the conversation; installing Mini Codex does not install or connect Android Use. No shared API, automatic handoff, or simultaneous two-display operation is verified by this release.

Stopping a network component or the worker may cut this connection. Prepare recovery before changing it. When a job is pending, use `phone_job_result`; verify an uncertain result before repeating an action. Restored connectivity requires a new successful phone operation. If the channel remains unavailable, recovery requires the owner on the phone or an independently configured connection.

Root belongs to the local service; installation does not give the ChatGPT APK root. Disabling or removing the Magisk module stops the worker while preserving private configuration and task memory.
