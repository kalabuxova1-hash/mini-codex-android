# INSTALL_WITH_CODEX.md — Android Use 0.0.1

This is an installation brief for Codex running on the owner's PC.

**Task:** Set up this Android Use companion for Mini Codex using the included source tree and an owner-authorized Android device. Take responsibility for checking prerequisites, performing the supported installation and testing the result, rather than making the owner run individual commands.

Before setup, check for an authorized ADB connection, pre-existing root, Magisk and Termux Python. **Root and Magisk installation are expressly outside this project.** Do not unlock bootloaders, modify firmware, or install either product. Stop and report missing prerequisites.

The source files are organized as follows:
- src/core/ — Python controller and two runtime JARs for a separate Android virtual screen.
- src/relay/ — the Android Use outbound relay agent and MCP tool definitions.
- src/java/ — development reference sources.
- magisk/ — metadata and startup scripts.

Inspect the files and existing phone installation. Preserve existing private settings and Mini Codex. Install the standalone core, relay worker and startup files using approved ADB access, backing up existing Android Use runtime files before replacement. Validate Python syntax, confirm the core self-test, and check service startup.

For remote use, build a **new, owner-private** HTTPS Site and ChatGPT plugin based on this repository's relay/ template and docs/deploy-private-relay.md. Use the Android Use tool definitions rather than Mini Codex's own phone controls. Use separately generated private credentials stored outside the public source tree. Do not reuse another user's server or settings. If the required private hosting tools are not available, report that remote registration is still needed.

Finally verify the new plugin's status, creation of a private virtual screen, a safe GUI interaction and display cleanup. Confirm that the physical display was not commandeered. If any verification fails, report the actual state and retain backups. After initial configuration, daily phone-side operation does not need an active PC.

Version: **0.0.1**. This source distribution does not itself install root, Magisk, Termux or a secure private relay.
