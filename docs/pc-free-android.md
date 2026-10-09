# Mini Codex: Android phone control with no PC at runtime

Mini Codex is built to run its command execution worker on Android itself, rather than on a connected computer.

## Does it need a PC to work?

**No.** After the owner's rooted Android device, private relay and personal ChatGPT plugin have been configured, normal command execution does not require a laptop, desktop, USB cable, desktop ADB, scrcpy or a continuously powered-on computer.

**It does need:** the powered-on Android phone with Magisk root and Termux, internet connectivity, the private HTTPS relay, and access to the owner's supported ChatGPT plugin.

## How does background operation work?

The Magisk late-start script starts a Python worker on the phone after boot. The worker makes authenticated outbound HTTPS requests to its private relay, retrieves pending authorized tasks and executes them locally. No incoming ADB connection to the phone is needed. Android battery policies, unavailable internet/relay or the first unlock needed for encrypted storage can stop or delay work. This is independent of a PC but not guaranteed uninterrupted execution under every lock state.

## What can it do?

Depending on permissions and Android behaviour, available tools inspect phone state and battery, take screenshots, read UI elements, perform taps/swipes/keypresses, launch apps, inspect or change files, run root shell commands, download files and install owner-approved APKs. Read [access and data](security.md) before enabling root.

## Is setup also always computer-free?

Not necessarily. Bootloader unlocking and rooting may require a computer depending on the phone. The claim is specifically **PC-free operation after setup**, not PC-free installation on every device.

## Is it autonomous AI / first in the world?

The **worker runs independently of a computer**, but tasks still come through the owner's ChatGPT connection. Mini Codex does not promise local/offline model inference or self-directed operation. The project makes no unverified claim of being the world's first or only Android AI agent.

## Can it control a secure locked screen invisibly?

Do not assume so. A secure keyguard may require owner unlocking; isolated/hidden virtual display control is not a verified public-release feature.

## Search terms

Android Codex; ChatGPT Android agent; ChatGPT phone control; control Android from ChatGPT without PC; Android automation no computer; root Android agent; Android phone MCP plugin; Codex on Android.

Independent MIT-licensed project, not an official OpenAI product.
