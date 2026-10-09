# Mini Codex — phone plugin

English | [Русский](README.ru.md)

Control your own Android from ChatGPT: manage files, download and install apps, and run commands. After setup, no computer is required.

## Requirements

- Android with **root and Magisk already installed**. You install root yourself; this project does not distribute firmware, drivers or bootloader unlocking tools.
- Official [Termux](https://github.com/termux/termux-app/releases) with Python.
- A personal Mini Codex plugin connection to your ChatGPT account and your own private server.

## How to connect

1. Install Termux, open it, and run:

   ```sh
   pkg update && pkg install python
   ```

2. Set up **your own** private server and personal plugin using the [connection guide](docs/deploy-private-relay.md). You can ask your Codex to do this; the guide includes a ready-to-use prompt. Every user has their own credentials and connection.

3. Download only `mini-codex-magisk-0.1.0.zip` from the [release](https://github.com/kalabuxova1-hash/mini-codex-android/releases/tag/v0.1.0). This is the Mini Codex agent, **not a root installer**. Verify its checksum against `SHA256SUMS`, install the ZIP in Magisk → Modules → Install from storage, and reboot your phone.

4. In Termux, run:

   ```sh
   su -c /data/adb/modules/mini_codex/configure.sh
   ```

   Grant root access. Enter your server URL, your agent credential, and the full `Bearer <your Sites bypass>` value if required. Credential input is hidden. Reboot your phone.

5. Install and connect **your own personal Site plugin** in ChatGPT. Ask: “Check my phone's status and root access.” Then verify that it works with your PC switched off.

**Ready:** request further actions in ChatGPT. You do not need to download separate APKs, source code or flashing tools to your phone. The agent is required: the plugin sends it jobs, and it executes them on Android. A plugin alone cannot access your device without the agent.

## What to know

The author's current personal plugin is not a shared server for other people's phones. The public guide helps you create your own connection. Mobile plugin availability depends on your ChatGPT account and must be checked during setup; installing the ZIP does not enable missing account features.

Agent memory and operational records are limited to **5 GiB**. Arbitrary downloads and files written by root commands are outside this budget. Memory stores notes between tasks; it does not train model weights.

To stop control, disable the Mini Codex module in Magisk. Removing the module preserves memory and configuration. Do not share credentials or access to your personal plugin.

Verified agent configuration: Redmi Turbo 3, Android 16, Magisk and Termux. The new public ZIP was checked with host tests and a mock environment; it was not installed over the author's working personal installation. Other devices require verification.

Details: [Android installation](docs/install-android.md), [compatibility](docs/compatibility.md), [access and data](docs/security.md), [changelog](CHANGELOG.md).

Independent project, not an official OpenAI product. Licensed under [MIT](LICENSE). The `agent/`, `magisk/` and `relay/` sources are provided for inspection and personal deployment; users do not need to download the entire repository to their phone.