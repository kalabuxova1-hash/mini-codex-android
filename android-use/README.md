# Android Use 0.0.1 — Mini Codex companion

**Android Use** is an optional Android screen-control plugin that complements [Mini Codex Android](https://github.com/kalabuxova1-hash/mini-codex-android). Mini Codex manages phone-side tasks; Android Use adds its own isolated, trusted **virtual display** for GUI actions without taking over the physical screen.

### What it does

- Creates and releases a dedicated Android virtual display.
- Opens apps, taps, swipes, presses permitted navigation keys and captures the virtual screen.
- Reads UI elements, clicks unique text matches and supports limited text entry.
- Runs validated batches of actions to reduce unnecessary round trips.
- Keeps UI actions scoped to the verified independent display: physical display 0 is not a fallback.
- Connects through the owner's private outbound HTTPS relay and supports operation after initial setup without a running PC.

### Why it matters for Mini Codex

Mini Codex can continue managing the phone while Android Use handles app interfaces on another display. This reduces disruption to the owner's foreground session. The services are separate and optional: Android Use is **not** bundled into Mini Codex's own installation.

### Install through Codex on a PC

Download this repository and give the **INSTALL_WITH_CODEX.md** file in this directory to Codex. Codex reads it, checks prerequisites, installs the plugin with authorized ADB and helps configure the owner's private connection. No manual installer wizard is required. See [INSTALL_WITH_CODEX.md](INSTALL_WITH_CODEX.md).

**Requirements:** rooted Android, preinstalled Magisk, Termux Python, permitted ADB access for initial PC setup, and an owner-specific private HTTPS relay/plugin. **We do not install root or Magisk, unlock bootloaders, change firmware or supply shared credentials.**

**Verification scope:** core and relay sources are taken from the author's working rooted Android 16 device. Not all devices, secure-lock situations, automatic startup after reboot, or text-entry paths have been independently verified.

**Support development:** [Voluntary donation via Boosty](https://boosty.to/mini_codexandroid). Donations are optional. Version: **0.0.1**.
