# Mini Codex for Android — phone control from ChatGPT without a PC

English | [Русский](README.ru.md)

**Mini Codex runs on Android itself. No PC, laptop, USB connection, desktop ADB server or permanently running computer is required for the agent to operate.**

Mini Codex is an independent, open-source Android agent that lets the owner request supported phone operations from ChatGPT. A local Python worker in Termux, started by a Magisk module, polls the owner's **private HTTPS relay** and executes authorized commands **on the Android phone**. The computer can be completely powered off during normal operation.

### PC-free Android operation

```text
ChatGPT (mobile or other supported client)
     ↕ owner's personal plugin
Private HTTPS relay (online service)
     ↕ authenticated outbound requests
Android phone: Mini Codex worker + Magisk + Termux
     ↓
Android UI, installed apps, filesystem and root commands
```

- **No desktop runtime:** the phone runs the agent, performs root shell commands, manages files, downloads files and installs owner-approved APKs locally; this does not rely on PC-side ADB, scrcpy or Windows/Linux/macOS.
- **Background worker and restart:** Magisk starts the worker after Android boots. It processes incoming queued jobs when its runtime, network, relay and permissions are available, including while no computer is connected. Android power management or a secure first-unlock requirement may interrupt it.
- **Control from ChatGPT:** available tools include phone/battery status, screenshots and UI hierarchy, taps/swipes/keys, launching apps and file operations.
- **Local persistent notes:** the agent can store compact memory records and archives within its managed 5 GiB limit. This does not train an AI model.
- **Private by design:** each owner needs their own personal plugin, private relay and credentials. No shared public root endpoint is included.

**Precise distinction:** "without a PC" describes **day-to-day operation after setup**, not a promise that every phone can be rooted or initially prepared without a computer. The system still requires internet access, a functioning private relay, a compatible ChatGPT plugin/account and locally installed root/Termux. This is not a fully offline autonomous AI; it executes requests through ChatGPT. The worker does not bypass a secure lock screen, and a separate hidden virtual display is not a verified release feature.

**Verified scope:** personal use on a rooted Redmi Turbo 3 / Android 16. The public v0.1.0 release ZIP was checked by host and mocked tests but not installed over the working personal installation. Other devices and background behaviour require testing.

For details, see the [PC-free operation FAQ](docs/pc-free-android.md).

## Setup instructions

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

## For independent reviewers

Reviewers and journalists can use the [English fact sheet and reproducible PC-free testing checklist](docs/press-kit.md). It distinguishes verified code and author reports from independent testing, and clearly lists limitations.

## Support development

You can support Mini Codex with a voluntary donation on [Boosty](https://boosty.to/mini_codexandroid). Donations help with development, compatibility testing, bug fixes, and documentation. Source code and public releases remain free under the MIT license.

## What to know

The author's current personal plugin is not a shared server for other people's phones. The public guide helps you create your own connection. Mobile plugin availability depends on your ChatGPT account and must be checked during setup; installing the ZIP does not enable missing account features.

Agent memory and operational records are limited to **5 GiB**. Arbitrary downloads and files written by root commands are outside this budget. Memory stores notes between tasks; it does not train model weights.

To stop control, disable the Mini Codex module in Magisk. Removing the module preserves memory and configuration. Do not share credentials or access to your personal plugin.

Verified agent configuration: Redmi Turbo 3, Android 16, Magisk and Termux. The new public ZIP was checked with host tests and a mock environment; it was not installed over the author's working personal installation. Other devices require verification.

Details: [Android installation](docs/install-android.md), [compatibility](docs/compatibility.md), [access and data](docs/security.md), [changelog](CHANGELOG.md).

Independent project, not an official OpenAI product. Licensed under [MIT](LICENSE). The `agent/`, `magisk/` and `relay/` sources are provided for inspection and personal deployment; users do not need to download the entire repository to their phone.
