# Codaki Mini Codex Android — autonomous AI phone agent for ChatGPT (no PC required)

English | [Русский](README.ru.md)

Also known as **Codaki Mini Codex Android** or **Миникодекс** in Russian. This project focuses on on-device Android control from ChatGPT rather than remote control of a desktop Codex installation.

**Android AI agent · ChatGPT phone control · Android automation · MCP · Termux · Magisk.** Codaki Mini Codex is an independent open-source project for controlling a rooted Android phone from ChatGPT: launch apps, inspect the screen, tap and swipe, run authorized local commands and manage files. The Python worker runs **on the phone**, communicates through the owner's authenticated private HTTPS relay, and **does not require a permanently running PC, USB or desktop ADB during normal use**. This is not the official OpenAI Codex CLI.

**Current version: Codaki Mini Codex 0.2.0 (`0.2.0`).** Built-in support returns a device passport and maintenance guide through `phone_status`. It retrieves previous confirmed solutions from existing task memory and saves new verified lessons. Each phone generates its own inventory; this does not train model weights. See the [0.2.0 changelog](CHANGELOG.md).

### What changed in 0.2.0

- A support skill guides diagnosis, service/file discovery and verification after maintenance.
- A local passport records Android version, installed-package metadata, Magisk modules, important paths and a verification timestamp. Each owner generates their own inventory.
- `phone_status` exposes the guide, summary, freshness flag and refresh command.
- Experience accumulation reuses existing memory to retrieve previous solutions and save short confirmed lessons. It adds no second history store or model-weight training.
- The panel and Magisk display version 0.2.0; upgrades retain connection settings, memory and the job journal.

### Using Android Use alongside Codaki Mini Codex

The support guide accounts for the optional **Android Use** plugin. Inventory checks known relay/core paths and Magisk module metadata when present. Android Use can operate a separate virtual display; Codaki Mini Codex uses the screen returned by its own tools. Obtain fresh UI data from the selected plugin and never transfer coordinates, nodes or job IDs between them.

Install and connect Android Use separately; Codaki Mini Codex does not require it. Version 0.2.0 adds component awareness and coexistence instructions. A shared API, automatic switching and simultaneous two-display operation are not implemented or verified by this release.

**Codaki Mini Codex runs on Android itself. No PC, laptop, USB connection, desktop ADB server or permanently running computer is required for the agent to operate.**

Codaki Mini Codex is an independent, open-source Android agent that lets the owner request supported phone operations from ChatGPT. A local Python worker in Termux, started by a Magisk module, polls the owner's **private HTTPS relay** and executes authorized commands **on the Android phone**. The computer can be completely powered off during normal operation.

### PC-free Android operation

```text
ChatGPT (mobile or other supported client)
     ↕ owner's personal plugin
Private HTTPS relay (online service)
     ↕ authenticated outbound requests
Android phone: Codaki Mini Codex worker + Magisk + Termux
     ↓
Android UI, installed apps, filesystem and root commands
```

- **No desktop runtime:** the phone runs the agent, performs root shell commands, manages files, downloads files and installs owner-approved APKs locally; this does not rely on PC-side ADB, scrcpy or Windows/Linux/macOS.
- **Background worker and restart:** Magisk starts the worker after Android boots. It processes incoming queued jobs when its runtime, network, relay and permissions are available, including while no computer is connected. Android power management or a secure first-unlock requirement may interrupt it.
- **Control from ChatGPT:** available tools include phone/battery status, screenshots and UI hierarchy, taps/swipes/keys, launching apps and file operations.
- **Local persistent notes:** the agent can store compact memory records and archives within its managed 5 GiB limit. This does not train an AI model.
- **Private by design:** each owner needs their own personal plugin, private relay and credentials. No shared public root endpoint is included.

**Precise distinction:** "without a PC" describes **day-to-day operation after setup**, not a promise that every phone can be rooted or initially prepared without a computer. The system still requires internet access, a functioning private relay, a compatible ChatGPT plugin/account and locally installed root/Termux. This is not a fully offline autonomous AI; it executes requests through ChatGPT. The worker does not bypass a secure lock screen, and a separate hidden virtual display is not a verified release feature.

**Verified scope:** personal use on a rooted Redmi Turbo 3 / Android 16. The public v0.2.0 release ZIP was checked by host and mocked tests but not installed over the working personal installation. Other devices and background behaviour require testing.

For details, see the [PC-free operation FAQ](docs/pc-free-android.md).

## Setup instructions

## Requirements

- Android with **root and Magisk already installed**. You install root yourself; this project does not distribute firmware, drivers or bootloader unlocking tools.
- Official [Termux](https://github.com/termux/termux-app/releases) with Python.
- A personal Codaki Mini Codex plugin connection to your ChatGPT account and your own private server.

## Install with Codex

1. Download `mini-codex-magisk-0.2.0.zip` from the [latest release](https://github.com/kalabuxova1-hash/codaki-mini-codex/releases/latest) together with `SHA256SUMS`.
2. Give the ZIP and checksum to Codex and send:

   > Install Codaki Mini Codex 0.2.0 from this file on my phone. Read INSTALL_WITH_CODEX.md inside the ZIP, verify requirements, configure my own private relay/plugin and check the connection. Use available phone tools or authorized ADB; retain existing settings and memory on upgrade.

3. If Codex already has an authorized phone-control channel, it can use it. Otherwise connect the phone to the computer running Codex and approve USB debugging. Codex handles the supported installation and configuration steps; Android may require you to unlock after reboot.

Root/Magisk and Termux Python must already be installed. The ZIP does not root the phone, install Termux or turn a phone-only chat into an ADB host. The embedded instructions are a workflow for Codex with actual device tools, not an independent installer AI.

See [installation details and manual setup](docs/install-android.md) and [private relay setup](docs/deploy-private-relay.md).

## For independent reviewers

Reviewers and journalists can use the [English fact sheet and reproducible PC-free testing checklist](docs/press-kit.md). It distinguishes verified code and author reports from independent testing, and clearly lists limitations.

## Support development

You can support Codaki Mini Codex with a voluntary donation on [Boosty](https://boosty.to/mini_codexandroid). Donations help with development, compatibility testing, bug fixes, and documentation. Source code and public releases remain free under the MIT license.

## What to know

The author's current personal plugin is not a shared server for other people's phones. The public guide helps you create your own connection. Mobile plugin availability depends on your ChatGPT account and must be checked during setup; installing the ZIP does not enable missing account features.

Agent memory and operational records are limited to **5 GiB**. Arbitrary downloads and files written by root commands are outside this budget. Memory stores notes between tasks; it does not train model weights.

To stop control, disable the Codaki Mini Codex module in Magisk. Removing the module preserves memory and configuration. Do not share credentials or access to your personal plugin.

Verified agent configuration: Redmi Turbo 3, Android 16, Magisk and Termux. The new public ZIP was checked with host tests and a mock environment; it was not installed over the author's working personal installation. Other devices require verification.

Details: [Android installation](docs/install-android.md), [compatibility](docs/compatibility.md), [access and data](docs/security.md), [changelog](CHANGELOG.md).

Independent project, not an official OpenAI product. Licensed under [MIT](LICENSE). The `agent/`, `magisk/` and `relay/` sources are provided for inspection and personal deployment; users do not need to download the entire repository to their phone.
