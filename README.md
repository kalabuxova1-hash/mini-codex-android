# Codaki

**Mini Codex Android · Миникодекс**

**English** · [Русский](README.ru.md) &nbsp; | &nbsp; **v0.2.0** · [MIT](LICENSE)

**Codaki Mini Codex Android is an AI agent for controlling your phone through ChatGPT.** Launch apps, inspect the screen, manage files and automate tasks on a rooted Android phone. The project is also known as **Миникодекс** in Russian.

**Codaki runs on the phone itself, without a permanently running PC.** After setup, normal use requires no USB or desktop ADB connection. You still need internet access, your own private HTTPS server and a ChatGPT plugin supported by your account.

[Install Codaki](#codaki-install) · [Features](#codaki-features) · [Documentation](#codaki-docs) · [Download release](https://github.com/kalabuxova1-hash/codaki-mini-codex/releases/latest)

<br>

<a name="codaki-features"></a>

## What Codaki can do

<table>
<tr>
<td align="center" valign="top" width="56">
<img src="docs/assets/icons/phone.svg" width="40" height="40" alt="">
</td>
<td valign="top">
<strong>Control Android</strong>
<p>Launch apps, inspect the screen, tap, swipe and check your phone's status.</p>
</td>
</tr>
<tr>
<td align="center" valign="top" width="56">
<img src="docs/assets/icons/files.svg" width="40" height="40" alt="">
</td>
<td valign="top">
<strong>Manage files</strong>
<p>Read, save and download files. Install owner-approved APKs and run authorized local commands.</p>
</td>
</tr>
<tr>
<td align="center" valign="top" width="56">
<img src="docs/assets/icons/memory.svg" width="40" height="40" alt="">
</td>
<td valign="top">
<strong>Remember solutions</strong>
<p>Keep preferences, notes and verified ways to complete tasks. Memory and operational records — up to 5 GiB.</p>
</td>
</tr>
</table>

Codaki combines ChatGPT phone control and Android automation: a Python worker in **Termux**, startup through **Magisk** and a personal **MCP** plugin connection.

<br>

<a name="codaki-install"></a>

## <img src="docs/assets/icons/wrench.svg" width="36" height="36" alt=""> Install Codaki and connect the plugin

### Prepare your phone

- Android with **root and Magisk already installed**. You install root yourself.
- Official [Termux](https://github.com/termux/termux-app/releases) with Python.
- The ability to connect a personal ChatGPT plugin and configure your own private HTTPS server.

### Install with Codex

1. **Download the Codaki release.** Get `mini-codex-magisk-0.2.0.zip` and `SHA256SUMS` from the [latest release](https://github.com/kalabuxova1-hash/codaki-mini-codex/releases/latest).

2. **Give the files to Codex.** Ask it to check requirements, install the module and configure your private server and plugin. A ready-to-use prompt is below.

3. **Check the connection.** Select your personal “Codaki Mini Codex — phone” plugin in ChatGPT and ask: “Check my phone's status.”

<details>
<summary><strong>Show the installation prompt for Codex</strong></summary>

> Install Codaki Mini Codex 0.2.0 from this file on my phone. Read INSTALL_WITH_CODEX.md inside the ZIP, verify requirements, configure my own private relay/plugin and check the connection. Use available phone tools or authorized ADB; retain existing settings and memory on upgrade.

If Codex already has an authorized phone-control channel, it can use it. Otherwise connect the phone to the computer running Codex and approve USB debugging. Codex handles the supported installation and configuration steps; Android may require you to unlock after reboot.

The ZIP does not root the phone, install Termux or turn a phone-only chat into an ADB host. The embedded instructions are a workflow for Codex with actual device tools, not an independent installer AI. Firmware, drivers and bootloader unlocking tools are not distributed here.

</details>

**Initial setup may require a computer.** PC-free operation describes day-to-day use after setup.

[Installation and manual setup](docs/install-android.md) · [Private server setup](docs/deploy-private-relay.md)

<br>

<a name="codaki-docs"></a>

## <img src="docs/assets/icons/book.svg" width="36" height="36" alt=""> Codaki documentation

Details are grouped by topic — open the section you need.

<details>
<summary><strong>How Codaki controls Android without a PC</strong></summary>

A Python worker runs **on the phone itself** in Termux, started by Magisk. It polls the owner's private HTTPS server for authorized jobs and executes them on Android. The computer can be completely powered off during normal operation.

```text
ChatGPT → personal Codaki plugin → private HTTPS server
                                          ↕
                           Android: Codaki + Termux + Magisk
                                          ↓
                           Apps, screen, files and root commands
```

- **Background operation.** Magisk starts the worker after Android boots. Power management or a secure first-unlock requirement may interrupt it.
- **Personal connection.** Each owner needs their own private server, plugin and credentials. The author's personal plugin is not a shared server for other people's phones.
- **Plugin availability.** This depends on your ChatGPT account and must be checked during setup. Installing the ZIP does not enable missing account features.

Codaki is not a fully offline AI: requests require ChatGPT, internet access and a functioning private server. The worker does not bypass a secure lock screen. A hidden virtual display is not a verified public release feature.

[PC-free Android operation FAQ](docs/pc-free-android.md)

</details>

<details>
<summary><strong>Codaki memory and what's new in version 0.2.0</strong></summary>

Memory stores short notes, preferences and compressed archives between tasks. Memory and operational records share a **5 GiB** limit: storage fills gradually, and the oldest records are removed when the limit is reached. Arbitrary downloads and files written by root commands are outside this budget. This stores experience; it does not train model weights.

- A support skill guides diagnosis, service/file discovery and verification after maintenance.
- A local passport records Android version, installed-package metadata, Magisk modules, important paths and a verification timestamp. Each phone generates its own inventory locally; the support guide instructs the agent to refresh it after component changes.
- `phone_status` exposes the guide, summary, freshness flag and refresh command.
- Existing memory retrieves previous confirmed solutions and saves new verified lessons. No second history store or model-weight training is added.
- The panel and Magisk display version 0.2.0; upgrades retain connection settings, memory and the job journal.

[Codaki 0.2.0 changelog](CHANGELOG.md)

</details>

<details>
<summary><strong>Compatibility, verified devices and access</strong></summary>

**Verified personal configuration:** Redmi Turbo 3, Android 16, root, Magisk and Termux. The public v0.2.0 ZIP was checked by host and mocked tests but not installed over the working personal installation. Other devices require separate testing.

To stop control, disable the Codaki Mini Codex module in Magisk. Removing the module preserves memory and configuration. Do not share credentials or access to your personal plugin.

[Android compatibility](docs/compatibility.md) · [Access and data](docs/security.md)

</details>

<details>
<summary><strong>Materials for reviewers and journalists</strong></summary>

Reviewers and journalists can use the [Codaki fact sheet and reproducible PC-free testing checklist](docs/press-kit.md). It distinguishes verified features from author reports and clearly lists limitations and independent testing steps.

The `agent/`, `magisk/` and `relay/` sources are provided for inspection and personal deployment. Users do not need to download the entire repository to their phone.

</details>

<br>

## <img src="docs/assets/icons/heart.svg" width="36" height="36" alt=""> Support Codaki

Voluntary support on [Boosty](https://boosty.to/mini_codexandroid) helps develop Codaki, test compatibility and fix bugs. Source code and public releases remain free under the **MIT license**.

---

**Codaki** is an independent open-source project, not an official OpenAI product or the official Codex CLI. Licensed under [MIT](LICENSE).
