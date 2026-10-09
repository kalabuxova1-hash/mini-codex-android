#!/system/bin/sh
MODDIR=${0%/*}
BASE=/data/adb/mini-codex
for path in "$BASE" "$BASE/agent.pid" "$BASE/enabled"; do
  [ ! -L "$path" ] || { echo 'Refusing linked private storage.'; exit 1; }
done
# Revocation stops future work even when the process is already offline.
rm -f "$BASE/enabled"
pid=$(cat "$BASE/agent.pid" 2>/dev/null)
case "$pid" in ''|*[!0-9]*) exit 0;; esac
command=$(tr '\000' '\n' <"/proc/$pid/cmdline" 2>/dev/null)
case "$command" in
  *"$MODDIR/agent/phone_agent.py"*"$BASE/config.json"*) kill -TERM "$pid" 2>/dev/null;;
  *) echo 'No matching agent process; no process was killed.';;
esac
