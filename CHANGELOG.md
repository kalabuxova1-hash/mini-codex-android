# Changelog

English | [Русский](CHANGELOG.ru.md)

## 2.0.0

Installation now starts by handing the release ZIP to Codex. The ZIP includes `INSTALL_WITH_CODEX.md`: an explicit device/ADB workflow, private relay setup and verification. This requires actual device tools and existing root/Magisk/Termux Python; it is not an autonomous AI installer.

The owner-designated Mini Codex 2.0 release adds built-in device support. `phone_status` supplies the support guide, timestamped device inventory, reference paths and a refresh command. Inventory is generated locally for each owner's phone from OS properties, package metadata, Magisk modules and path existence; no personal passport is distributed.

Android Use coexistence is documented: known component paths are inventoried and tools must use fresh data from their own display. Coordinates and jobs cannot be shared across plugins. This adds component awareness and guidance, not a common API or automatic switching; simultaneous two-display operation has not been independently verified.

The support guide reuses existing notes and the job journal to retrieve previous solutions and save verified maintenance lessons. It does not train model weights or run another AI agent. The Magisk service refreshes inventory after validated setup; a failed refresh does not prevent the worker from starting. Updates retain credentials, memory and operational records.

Version 2.0 is displayed by the panel and Magisk module; package/MCP versions use `2.0.0`. The public packaging and storage paths differ from the author's existing personal installation. The public ZIP requires its own private relay configuration.

## 0.1.0

First public bundle: a Python agent for Android, a Magisk installer, local credential configuration, and a template for a separate private Site relay.

Includes bounded memory with gzip archives, a job journal, installation checks, and a release content scanner. The public bundle contains no personal configuration and does not automatically update working installations.
