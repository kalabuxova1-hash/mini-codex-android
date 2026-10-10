# Changelog

English | [Русский](CHANGELOG.ru.md)

## 0.2.1

Includes an update skill: give GPT a newer ZIP to prepare/apply an update while preserving the existing App reference, private relay and phone state.

Packaging update: include the portable ChatGPT card ZIP, icon, setup/control skills and card builder inside the Magisk installer and as a separate release download. Public cards have no owner App ID or device pairing; an owner-specific App reference can be built privately after relay setup. Checksums cover both archives. The phone runtime and module remain 0.2.0; no device code or existing owner configuration changes.

## 0.2.0

Installation now starts by handing the release ZIP to Codex. The ZIP includes `INSTALL_WITH_CODEX.md`: an explicit device/ADB workflow, private relay setup and verification. This requires actual device tools and existing root/Magisk/Termux Python; it is not an autonomous AI installer.

The owner-designated Codaki Mini Codex 0.2.0 release adds built-in device support. `phone_status` supplies the support guide, timestamped device inventory, reference paths and a refresh command. Inventory is generated locally for each owner's phone from OS properties, package metadata, Magisk modules and path existence; no personal passport is distributed.


The support guide reuses existing notes and the job journal to retrieve previous solutions and save verified maintenance lessons. It does not train model weights or run another AI agent. The Magisk service refreshes inventory after validated setup; a failed refresh does not prevent the worker from starting. Updates retain credentials, memory and operational records.

Version 0.2.0 is displayed by the panel and Magisk module; package/MCP versions use `0.2.0`. The public packaging and storage paths differ from the author's existing personal installation. The public ZIP requires its own private relay configuration.

## 0.1.0

First public bundle: a Python agent for Android, a Magisk installer, local credential configuration, and a template for a separate private Site relay.

Includes bounded memory with gzip archives, a job journal, installation checks, and a release content scanner. The public bundle contains no personal configuration and does not automatically update working installations.
