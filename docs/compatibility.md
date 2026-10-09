# Compatibility and connection

English | [Русский](compatibility.ru.md)

Verified configuration: **Redmi Turbo 3, arm64, Android 16, Global HyperOS, Magisk and Termux 0.118.3 from the official GitHub repository**. Other phones, Android versions and root managers require separate verification. After setup, APK installation and ordinary root commands run inside Android without Fastboot. Operation without a PC requires a running agent, internet access and your own available relay deployment.

## GitHub, personal plugin and phone

GitHub provides source code and release downloads. Installing a module from the repository does not automatically add tools to any ChatGPT account. Each owner separately deploys their own private relay/Site, creates a personal plugin and configures their own phone. The public archive contains no shared author server or embedded credentials.

Importing a GitHub plugin with `mcp.json`, `.mcp.json` or an embedded MCP server description is marked **Desktop only**, even when the server has an HTTPS URL. Such an import must not be presented as a ready-to-use mobile connection. This is stated in the [official OpenAI plugin management documentation](https://learn.chatgpt.com/docs/enterprise/plugin-management).

For mobile use, this project uses **a personal Site plugin with your own relay**. Check its availability, connection and tool calls in your target account and Android client. A repository, skill or root access does not guarantee that the plugin interface is available on every plan or workspace. The module cannot enable account features that are unavailable.

The [official OpenAI plugin creation documentation](https://learn.chatgpt.com/docs/build-plugins) describes starting privately, separate creation/use permissions and granting access to selected people. Connecting the app is a separate step; distributing source code does not transfer the owner's authorization. For multiple users, create separate deployments and credentials, then verify each plugin's permissions.

## Verify a new installation

First check status and root access, then read the app list and try a simple safe tool. Test after disconnecting USB/the PC, after rebooting and after changing networks. Also test credential revocation: commands with the old credential must be rejected. The manufacturer may stop background apps; an unavailable relay, blocked network or disabled Termux will stop control.

The runtime is installed in Termux's private directory. ChatGPT remains the conversation client; commands are executed by the agent that the owner granted root access to. See [access boundaries and revocation](security.md).